# app/routes/queue.py
from flask import request, jsonify
from datetime import datetime, timedelta, timezone
import random
import string

from app.config.firebase import get_db
from app.middleware.authRequired import auth_required
from app.middleware.roleRequired import staff_required
from app.utils.triage import compute_triage_level, estimate_wait_minutes, LEVEL_TO_LETTER
from app.config.smtp import email_service          # adjust to wherever smtp.py actually lives
from app.utils.emailTemplates import get_queue_code_email   # adjust to wherever emailTemplates.py actually lives
from google.cloud.firestore_v1.base_query import FieldFilter
import logging

logger = logging.getLogger(__name__)

CODE_TTL_MINUTES = 30


def _generate_code():
    return ''.join(random.choices(string.digits, k=6))


def _next_queue_number(db, letter: str) -> str:
    """Atomically increments today's counter for a given priority letter
    and returns a formatted queue number like 'A007'.
    NOTE: keyed on UTC date — if the hospital isn't on UTC, this can roll
    over mid-shift rather than at local midnight. Swap in a local-timezone
    date string if that matters for you."""
    today_key = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    counter_ref = db.collection('queueCounters').document(f'{today_key}_{letter}')

    @db.transaction()
    def bump(transaction):
        snapshot = counter_ref.get(transaction=transaction)
        current = snapshot.get('count') if snapshot.exists else 0
        new_count = (current or 0) + 1
        transaction.set(counter_ref, {'count': new_count, 'date': today_key}, merge=True)
        return new_count

    count = bump(db.transaction())
    return f"{letter}{str(count).zfill(3)}"


def _people_ahead(db, entry_level: int, entry_queued_at):
    """Counts queued patients who should be seen before this one: everyone
    with a more urgent triage level, plus anyone at the same level who
    queued earlier. Requires composite indexes on (status, triageLevel) and
    (status, triageLevel, queuedAt) — Firestore will give you a direct
    console link to create these the first time it runs if they're missing."""
    higher = db.collection('queueEntries') \
        .where(filter=FieldFilter('status', '==', 'queued')) \
        .where(filter=FieldFilter('triageLevel', '<', entry_level)) \
        .stream()
    higher_count = sum(1 for _ in higher)

    same_level = db.collection('queueEntries') \
        .where(filter=FieldFilter('status', '==', 'queued')) \
        .where(filter=FieldFilter('triageLevel', '==', entry_level)) \
        .stream()
    same_earlier = sum(
        1 for doc in same_level
        if doc.to_dict().get('queuedAt') and entry_queued_at and
        doc.to_dict().get('queuedAt') < entry_queued_at
    )

    return higher_count + same_earlier


def _public_queue_view(doc_id, data, db):
    """Shapes a queueEntries doc into what the patient-facing screens need —
    deliberately excludes anything not already volunteered back to them.
    No other patients' data, ever."""
    level = data.get('triageLevel') or 5
    ahead = _people_ahead(db, level, data.get('queuedAt')) if data.get('status') == 'queued' else 0

    return {
        'id': doc_id,
        'queueId': data.get('queueNumber'),
        'patient': data.get('fullName'),
        'doctor': data.get('assignedDoctor') or 'To be assigned',
        'room': data.get('assignedRoom'),
        'type': data.get('reason'),
        'date': data.get('appointmentDate'),
        'time': data.get('appointmentTime'),
        'status': data.get('status'),
        'peopleAhead': ahead,
        'estimatedWaitMinutes': estimate_wait_minutes(ahead, level),
    }


def register_routes(app):
    logger.info("🔧 Registering queue routes...")

    # =====================================================================
    # PUBLIC: submit the intake form, get a code emailed
    # =====================================================================
    @app.route('/api/queue/join', methods=['POST', 'OPTIONS'])
    def queue_join():
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            payload = request.get_json() or {}

            required = ['fullName', 'phone', 'email']
            missing = [f for f in required if not payload.get(f)]
            if missing:
                return jsonify({'success': False, 'error': f'Missing required fields: {", ".join(missing)}'}), 400

            level, letter = compute_triage_level(payload)
            now = datetime.now(timezone.utc)
            code = _generate_code()

            db = get_db()
            entry_data = {
                'fullName': payload.get('fullName'),
                'dateOfBirth': payload.get('dateOfBirth'),
                'phone': payload.get('phone'),
                'email': payload.get('email'),
                'reason': payload.get('reason'),
                'appointmentDate': payload.get('appointmentDate'),
                'appointmentTime': payload.get('appointmentTime'),
                'duration': payload.get('duration'),
                'painLevel': payload.get('painLevel'),
                'symptoms': payload.get('symptoms') or [],
                'isEmergency': payload.get('isEmergency') == 'Yes',
                'condition': payload.get('condition'),
                'allergies': payload.get('allergies') or [],
                'medications': payload.get('medications') or [],
                'hadSurgery': payload.get('hadSurgery') == 'Yes',
                'surgeryDetails': payload.get('surgeryDetails'),
                'contactName': payload.get('contactName'),
                'contactRelation': payload.get('contactRelation'),
                'contactPhone': payload.get('contactPhone'),
                'contactEmail': payload.get('contactEmail'),
                'contactMethod': payload.get('contactMethod'),
                'triageLevel': level,
                'priorityLetter': letter,
                'triageOverride': False,
                'verificationCode': code,
                'codeExpiresAt': now + timedelta(minutes=CODE_TTL_MINUTES),
                'codeVerified': False,
                'status': 'pending_verification',
                'createdAt': now,
                'updatedAt': now,
            }

            doc_ref = db.collection('queueEntries').document()
            doc_ref.set(entry_data)

            sent = email_service.send_email(
                to_email=payload.get('email'),
                subject="Your Medic queue code",
                html_content=get_queue_code_email(code, payload.get('fullName')),
            )
            if not sent:
                logger.warning(f"⚠️ Queue entry {doc_ref.id} created but code email failed to send")

            logger.info(f"✅ Queue entry created: {doc_ref.id} (priority {letter})")

            return jsonify({
                'success': True,
                'data': {'queueEntryId': doc_ref.id, 'emailSent': sent}
            }), 201

        except Exception as e:
            logger.error(f"❌ Queue join error: {str(e)}")
            import traceback; traceback.print_exc()
            return jsonify({'success': False, 'error': 'Failed to join queue'}), 500

    # =====================================================================
    # PUBLIC: verify the 6-digit code, get queued, get a queue number
    # =====================================================================
    @app.route('/api/queue/verify-code', methods=['POST', 'OPTIONS'])
    def queue_verify_code():
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            data = request.get_json() or {}
            code = (data.get('code') or '').strip()
            if len(code) != 6:
                return jsonify({'success': False, 'error': 'Please enter the full 6-digit code.'}), 400

            db = get_db()
            matches = db.collection('queueEntries') \
                .where(filter=FieldFilter('verificationCode', '==', code)) \
                .where(filter=FieldFilter('codeVerified', '==', False)) \
                .limit(1).stream()

            doc = next(matches, None)
            if not doc:
                return jsonify({'success': False, 'error': 'Invalid code. Please try again.'}), 404

            entry = doc.to_dict()
            expires_at = entry.get('codeExpiresAt')
            now = datetime.now(timezone.utc)
            if expires_at and expires_at < now:
                return jsonify({'success': False, 'error': 'This code has expired. Please search for your appointment instead.'}), 410

            queue_number = _next_queue_number(db, entry.get('priorityLetter') or 'E')
            doc.reference.update({
                'codeVerified': True,
                'status': 'queued',
                'queueNumber': queue_number,
                'queuedAt': now,
                'updatedAt': now,
            })

            entry['queueNumber'] = queue_number
            entry['status'] = 'queued'
            entry['queuedAt'] = now

            return jsonify({'success': True, 'data': _public_queue_view(doc.id, entry, db)}), 200

        except Exception as e:
            logger.error(f"❌ Verify code error: {str(e)}")
            import traceback; traceback.print_exc()
            return jsonify({'success': False, 'error': 'Failed to verify code'}), 500

    # =====================================================================
    # PUBLIC: lost-code recovery — find by name + dob + phone
    # =====================================================================
    @app.route('/api/queue/find', methods=['POST', 'OPTIONS'])
    def queue_find():
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            data = request.get_json() or {}
            name = (data.get('name') or '').strip().lower()
            dob = data.get('dob')
            phone = (data.get('phone') or '').strip()

            if not (name and dob and phone):
                return jsonify({'success': False, 'error': 'Please fill in all fields'}), 400

            db = get_db()
            # Phone+DOB are the only exact-match fields Firestore can filter on;
            # name is checked in Python after, since Firestore can't do
            # case-insensitive matches natively.
            candidates = db.collection('queueEntries') \
                .where(filter=FieldFilter('phone', '==', phone)) \
                .where(filter=FieldFilter('dateOfBirth', '==', dob)) \
                .limit(10).stream()

            results = []
            for doc in candidates:
                entry = doc.to_dict()
                if entry.get('fullName', '').strip().lower() != name:
                    continue
                if entry.get('status') in ('completed', 'cancelled', 'no_show'):
                    continue
                results.append(_public_queue_view(doc.id, entry, db))

            return jsonify({'success': True, 'data': {'appointments': results}}), 200

        except Exception as e:
            logger.error(f"❌ Queue find error: {str(e)}")
            import traceback; traceback.print_exc()
            return jsonify({'success': False, 'error': 'Search failed'}), 500

    # =====================================================================
    # PUBLIC: "lost my code" flow already proved identity via /find —
    # queue them in directly, no code needed
    # =====================================================================
    @app.route('/api/queue/<entry_id>/queue-in', methods=['POST', 'OPTIONS'])
    def queue_in_directly(entry_id):
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            db = get_db()
            doc_ref = db.collection('queueEntries').document(entry_id)
            doc = doc_ref.get()
            if not doc.exists:
                return jsonify({'success': False, 'error': 'Queue entry not found'}), 404

            entry = doc.to_dict()
            if entry.get('status') == 'queued':
                return jsonify({'success': True, 'data': _public_queue_view(doc.id, entry, db)}), 200
            if entry.get('status') in ('completed', 'cancelled', 'no_show'):
                return jsonify({'success': False, 'error': 'This appointment is no longer active.'}), 410

            now = datetime.now(timezone.utc)
            queue_number = _next_queue_number(db, entry.get('priorityLetter') or 'E')
            doc_ref.update({
                'codeVerified': True,
                'status': 'queued',
                'queueNumber': queue_number,
                'queuedAt': now,
                'updatedAt': now,
            })
            entry.update({'queueNumber': queue_number, 'status': 'queued', 'queuedAt': now})
            return jsonify({'success': True, 'data': _public_queue_view(doc.id, entry, db)}), 200

        except Exception as e:
            logger.error(f"❌ Queue-in error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to queue in'}), 500

    # =====================================================================
    # PUBLIC: poll for live status (the waiting screen's countdown)
    # =====================================================================
    @app.route('/api/queue/status/<entry_id>', methods=['GET', 'OPTIONS'])
    def queue_status(entry_id):
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            db = get_db()
            doc = db.collection('queueEntries').document(entry_id).get()
            if not doc.exists:
                return jsonify({'success': False, 'error': 'Queue entry not found'}), 404
            return jsonify({'success': True, 'data': _public_queue_view(doc.id, doc.to_dict(), db)}), 200
        except Exception as e:
            logger.error(f"❌ Queue status error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to get status'}), 500

    # =====================================================================
    # PUBLIC: lobby/TV display — no personal info, ever
    # =====================================================================
    @app.route('/api/queue/display', methods=['GET', 'OPTIONS'])
    def queue_display():
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            db = get_db()

            now_serving_docs = db.collection('queueEntries') \
                .where(filter=FieldFilter('status', 'in', ['called', 'in_progress'])) \
                .stream()
            now_serving = [{
                'queueId': d.to_dict().get('queueNumber'),
                'room': d.to_dict().get('assignedRoom') or '—',
                'status': d.to_dict().get('status'),
            } for d in now_serving_docs]

            waiting_docs = db.collection('queueEntries') \
                .where(filter=FieldFilter('status', '==', 'queued')) \
                .order_by('triageLevel').order_by('queuedAt').limit(20).stream()
            waiting = [{
                'queueId': d.to_dict().get('queueNumber'),
                'priority': d.to_dict().get('priorityLetter'),
            } for d in waiting_docs]

            return jsonify({'success': True, 'data': {'nowServing': now_serving, 'waiting': waiting}}), 200

        except Exception as e:
            logger.error(f"❌ Queue display error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to load display'}), 500

    # =====================================================================
    # STAFF: full queue list w/ triage info
    # =====================================================================
    @app.route('/api/queue', methods=['GET', 'OPTIONS'])
    @auth_required
    @staff_required
    def queue_list_staff():
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            db = get_db()
            docs = db.collection('queueEntries') \
                .where(filter=FieldFilter('status', 'in', ['queued', 'called', 'in_progress'])) \
                .order_by('triageLevel').order_by('queuedAt').stream()

            entries = []
            for d in docs:
                e = d.to_dict()
                e['id'] = d.id
                for f in ['createdAt', 'updatedAt', 'queuedAt', 'calledAt', 'codeExpiresAt']:
                    if f in e and hasattr(e[f], 'isoformat'):
                        e[f] = e[f].isoformat()
                entries.append(e)

            return jsonify({'success': True, 'data': {'entries': entries, 'count': len(entries)}}), 200

        except Exception as e:
            logger.error(f"❌ Staff queue list error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to load queue'}), 500

    # =====================================================================
    # STAFF: override triage / assign doctor & room
    # =====================================================================
    @app.route('/api/queue/<entry_id>/triage', methods=['PATCH', 'OPTIONS'])
    @auth_required
    @staff_required
    def queue_update_triage(entry_id):
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            data = request.get_json() or {}
            db = get_db()
            doc_ref = db.collection('queueEntries').document(entry_id)
            if not doc_ref.get().exists:
                return jsonify({'success': False, 'error': 'Queue entry not found'}), 404

            update = {'updatedAt': datetime.now(timezone.utc), 'triageOverride': True}
            if 'triageLevel' in data:
                update['triageLevel'] = data['triageLevel']
                update['priorityLetter'] = LEVEL_TO_LETTER.get(data['triageLevel'], 'E')
            if 'assignedDoctor' in data:
                update['assignedDoctor'] = data['assignedDoctor']
            if 'assignedRoom' in data:
                update['assignedRoom'] = data['assignedRoom']

            doc_ref.update(update)
            logger.info(f"✅ {request.user_id} overrode triage for queue entry {entry_id}")
            return jsonify({'success': True, 'data': update}), 200

        except Exception as e:
            logger.error(f"❌ Triage override error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to update triage'}), 500

    # =====================================================================
    # STAFF: advance status (call / start / complete / cancel)
    # =====================================================================
    @app.route('/api/queue/<entry_id>/status', methods=['PATCH', 'OPTIONS'])
    @auth_required
    @staff_required
    def queue_update_status(entry_id):
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            data = request.get_json() or {}
            new_status = data.get('status')
            valid = {'called', 'in_progress', 'completed', 'cancelled', 'no_show'}
            if new_status not in valid:
                return jsonify({'success': False, 'error': f'status must be one of {sorted(valid)}'}), 400

            db = get_db()
            doc_ref = db.collection('queueEntries').document(entry_id)
            if not doc_ref.get().exists:
                return jsonify({'success': False, 'error': 'Queue entry not found'}), 404

            now = datetime.now(timezone.utc)
            update = {'status': new_status, 'updatedAt': now}
            if new_status == 'called':
                update['calledAt'] = now
            if new_status == 'completed':
                update['completedAt'] = now

            doc_ref.update(update)
            logger.info(f"✅ {request.user_id} set queue entry {entry_id} -> {new_status}")
            return jsonify({'success': True, 'data': update}), 200

        except Exception as e:
            logger.error(f"❌ Status update error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to update status'}), 500

    logger.info("✅ Queue routes registered successfully")