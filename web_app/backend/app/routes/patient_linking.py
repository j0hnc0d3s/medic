# app/routes/patient_linking.py
#
# Links a `patients`-collection record (staff-created, via the
# Patients tab) to a real login account (`users/{uid}`), by email.
#
# This runs server-side via the Admin SDK on purpose: looking up an
# arbitrary account by email and writing to *another user's* document
# is a cross-account operation that Firestore security rules correctly
# refuse to let a staff member's client SDK do directly — the same
# trust boundary that keeps registration server-side in auth.py.
# Don't move this back to a client-side authService/patientService
# call; it'll just hit "Missing or insufficient permissions" again.

from flask import request, jsonify
from firebase_admin import auth
from app.config.firebase import get_db
import logging

logger = logging.getLogger(__name__)

def register_routes(app):
    """Register patient-linking routes"""

    @app.route('/api/staff/patients/link', methods=['POST', 'OPTIONS'])
    def link_patient_to_account():
        """
        Body: { patientId, email }
        Finds the login account for `email` (Admin SDK — not a
        Firestore query, so it isn't subject to Firestore rules) and
        writes the link both directions:
          patients/{patientId}.userId -> uid  (matches firestore.rules' isOwner check)
          users/{uid}.patientRecordId       -> patientId
        """
        try:
            data = request.get_json() or {}
            patient_id = data.get('patientId')
            email = data.get('email')

            if not patient_id or not email:
                return jsonify({
                    'success': False,
                    'error': 'patientId and email are required'
                }), 400

            db = get_db()

            patient_ref = db.collection('patients').document(patient_id)
            if not patient_ref.get().exists:
                return jsonify({
                    'success': False,
                    'error': 'Patient record not found'
                }), 404

            try:
                user_record = auth.get_user_by_email(email.strip().lower())
            except Exception:
                return jsonify({
                    'success': False,
                    'error': 'No account found with that email'
                }), 404

            uid = user_record.uid

            patient_ref.update({'userId': uid})
            db.collection('users').document(uid).update({'patientRecordId': patient_id})

            logger.info(f"✅ Linked patient {patient_id} to user {uid} ({email})")

            return jsonify({
                'success': True,
                'uid': uid,
                'message': 'Patient record linked successfully'
            }), 200

        except Exception as e:
            logger.error(f"Patient link error: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Failed to link patient record'
            }), 500