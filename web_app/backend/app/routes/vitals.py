# app/routes/vitals.py
#
# Live vitals telemetry. A wearable device (real or simulated) pushes
# readings for a specific patient, identified by the same queueEntries id
# used everywhere else in the queue flow — so "pairing" a wearable or a
# bedside monitor to a patient is just entering/scanning that id, same as
# how the kiosk already ties a patient to that id at intake.
#
# No staff auth on ingest/latest: a wearable or bedside monitor is a
# device at the bedside, not a logged-in staff member. The channel id
# itself (a UUID, never guessable/sequential) is what scopes access.
from flask import request, jsonify
from datetime import datetime, timezone
import logging

from app.config.firebase import get_db

logger = logging.getLogger(__name__)

VITALS_HISTORY_LIMIT_DEFAULT = 30
VITALS_HISTORY_LIMIT_MAX = 200

VITAL_FIELDS = [
    'heartRate', 'spo2', 'respRate', 'tempF', 'systolicBP', 'diastolicBP',
]


def _clean_reading(payload):
    reading = {}
    for f in VITAL_FIELDS:
        val = payload.get(f)
        if val is not None:
            try:
                reading[f] = float(val)
            except (TypeError, ValueError):
                continue
    return reading


def register_routes(app):
    logger.info("🔧 Registering vitals routes...")

    # =====================================================================
    # DEVICE: push one reading for a patient (wearable / simulator)
    # =====================================================================
    @app.route('/api/vitals/<entry_id>', methods=['POST', 'OPTIONS'])
    def vitals_ingest(entry_id):
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            db = get_db()
            entry_ref = db.collection('queueEntries').document(entry_id)
            if not entry_ref.get().exists:
                return jsonify({'success': False, 'error': 'Unknown patient channel'}), 404

            payload = request.get_json() or {}
            reading = _clean_reading(payload)
            if not reading:
                return jsonify({'success': False, 'error': 'No recognized vitals fields in payload'}), 400

            now = datetime.now(timezone.utc)
            reading['recordedAt'] = now
            reading['source'] = payload.get('source', 'wearable')
            reading['deviceId'] = payload.get('deviceId')

            entry_ref.collection('vitals').add(reading)
            entry_ref.update({'latestVitals': reading, 'latestVitalsAt': now})

            return jsonify({'success': True, 'data': reading}), 201

        except Exception as e:
            logger.error(f"❌ Vitals ingest error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to record vitals'}), 500

    # =====================================================================
    # PUBLIC-ish: most recent reading for a patient (bedside monitor poll)
    # =====================================================================
    @app.route('/api/vitals/<entry_id>/latest', methods=['GET', 'OPTIONS'])
    def vitals_latest(entry_id):
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            db = get_db()
            doc = db.collection('queueEntries').document(entry_id).get()
            if not doc.exists:
                return jsonify({'success': False, 'error': 'Unknown patient channel'}), 404

            data = doc.to_dict()
            latest = data.get('latestVitals')
            if latest and hasattr(latest.get('recordedAt'), 'isoformat'):
                latest = {**latest, 'recordedAt': latest['recordedAt'].isoformat()}

            return jsonify({
                'success': True,
                'data': {
                    'patient': data.get('fullName'),
                    'queueId': data.get('queueNumber'),
                    'room': data.get('assignedRoom'),
                    'latest': latest,
                    'latestAt': data.get('latestVitalsAt').isoformat() if hasattr(data.get('latestVitalsAt'), 'isoformat') else None,
                },
            }), 200

        except Exception as e:
            logger.error(f"❌ Vitals latest error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to load vitals'}), 500

    # =====================================================================
    # PUBLIC-ish: short recent history for a small trend view
    # =====================================================================
    @app.route('/api/vitals/<entry_id>/history', methods=['GET', 'OPTIONS'])
    def vitals_history(entry_id):
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            limit = min(
                int(request.args.get('limit', VITALS_HISTORY_LIMIT_DEFAULT)),
                VITALS_HISTORY_LIMIT_MAX,
            )
            db = get_db()
            entry_ref = db.collection('queueEntries').document(entry_id)
            if not entry_ref.get().exists:
                return jsonify({'success': False, 'error': 'Unknown patient channel'}), 404

            docs = entry_ref.collection('vitals') \
                .order_by('recordedAt', direction='DESCENDING') \
                .limit(limit).stream()

            readings = []
            for d in docs:
                r = d.to_dict()
                if hasattr(r.get('recordedAt'), 'isoformat'):
                    r['recordedAt'] = r['recordedAt'].isoformat()
                readings.append(r)
            readings.reverse()  # oldest first, easiest for a chart to consume

            return jsonify({'success': True, 'data': {'readings': readings}}), 200

        except Exception as e:
            logger.error(f"❌ Vitals history error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to load vitals history'}), 500

    logger.info("✅ Vitals routes registered successfully")
