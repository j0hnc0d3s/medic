# app/routes/staff.py
from flask import request, jsonify
from datetime import datetime
from app.config.firebase import get_db
from app.middleware.authRequired import auth_required
from app.middleware.roleRequired import role_required, admin_required, staff_required
from google.cloud.firestore_v1.base_query import FieldFilter
import logging

logger = logging.getLogger(__name__)


def register_routes(app):
    """Register all staff routes"""
    
    logger.info("🔧 Registering staff routes...")

    # =========================================================================
    # GET ALL PATIENTS (Staff Only)
    # =========================================================================
    
    @app.route('/api/staff/patients', methods=['GET', 'OPTIONS'])
    @auth_required
    def get_all_patients():
        """Staff: Get list of all patients"""
        if request.method == 'OPTIONS':
            return ('', 204)
        
        try:
            user_id = request.user_id
            db = get_db()
            
            # Get current user to check role
            user_doc = db.collection('users').document(user_id).get()
            if not user_doc.exists:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            user_data = user_doc.to_dict()
            user_role = user_data.get('role', 'patient')
            
            # Check if user is staff
            if user_role not in ['admin', 'staff', 'doctor', 'nurse', 'receptionist']:
                return jsonify({'success': False, 'error': 'Staff access required'}), 403
            
            # Get query parameters
            limit = request.args.get('limit', 50, type=int)
            
            # Query for patients only using FieldFilter
            patients_ref = db.collection('users').where(
                filter=FieldFilter('role', '==', 'patient')
            ).limit(limit)
            
            patients = []
            for doc in patients_ref.stream():
                patient_data = doc.to_dict()
                patient_data['uid'] = doc.id
                
                # Convert datetime fields to ISO strings
                for field in ['createdAt', 'updatedAt', 'dob']:
                    if field in patient_data and hasattr(patient_data[field], 'isoformat'):
                        patient_data[field] = patient_data[field].isoformat()
                
                # Remove sensitive fields
                patient_data.pop('trn', None)
                patient_data.pop('nis', None)
                
                patients.append(patient_data)
            
            logger.info(f"✅ Staff {user_id} retrieved {len(patients)} patients")
            
            return jsonify({
                'success': True,
                'data': {
                    'patients': patients,
                    'count': len(patients)
                }
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Get patients error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': 'Failed to get patients'}), 500


    # =========================================================================
    # GET SPECIFIC PATIENT (Staff Only)
    # =========================================================================
    
    @app.route('/api/staff/patients/<patient_id>', methods=['GET', 'OPTIONS'])
    @auth_required
    def get_patient_details(patient_id):
        """Staff: Get specific patient details"""
        if request.method == 'OPTIONS':
            return ('', 204)
        
        try:
            user_id = request.user_id
            db = get_db()
            
            # Get current user to check role
            user_doc = db.collection('users').document(user_id).get()
            if not user_doc.exists:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            user_data = user_doc.to_dict()
            user_role = user_data.get('role', 'patient')
            
            # Check if user is staff
            if user_role not in ['admin', 'staff', 'doctor', 'nurse', 'receptionist']:
                return jsonify({'success': False, 'error': 'Staff access required'}), 403
            
            # Get patient document
            patient_ref = db.collection('users').document(patient_id)
            patient_doc = patient_ref.get()
            
            if not patient_doc.exists:
                return jsonify({'success': False, 'error': 'Patient not found'}), 404
            
            patient_data = patient_doc.to_dict()
            
            # Verify it's a patient
            if patient_data.get('role') != 'patient':
                return jsonify({'success': False, 'error': 'Not a patient'}), 400
            
            patient_data['uid'] = patient_id
            
            # Convert datetime fields
            for field in ['createdAt', 'updatedAt', 'dob']:
                if field in patient_data and hasattr(patient_data[field], 'isoformat'):
                    patient_data[field] = patient_data[field].isoformat()
            
            # Get medical records if available
            try:
                medical_record_ref = patient_ref.collection('medicalRecords').document('main')
                medical_record_doc = medical_record_ref.get()
                
                if medical_record_doc.exists:
                    patient_data['medicalRecord'] = medical_record_doc.to_dict()
            except Exception as mr_error:
                logger.warning(f"Could not fetch medical record: {str(mr_error)}")
            
            logger.info(f"✅ Staff {user_id} retrieved patient {patient_id}")
            
            return jsonify({'success': True, 'data': patient_data}), 200
            
        except Exception as e:
            logger.error(f"❌ Get patient details error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': 'Failed to get patient details'}), 500


    # =========================================================================
    # GET APPOINTMENTS (Staff Only)
    # =========================================================================
    
    @app.route('/api/staff/appointments', methods=['GET', 'OPTIONS'])
    @auth_required
    def get_staff_appointments():
        """Staff: Get all appointments"""
        if request.method == 'OPTIONS':
            return ('', 204)
        
        try:
            user_id = request.user_id
            db = get_db()
            
            # Get current user to check role
            user_doc = db.collection('users').document(user_id).get()
            if not user_doc.exists:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            user_data = user_doc.to_dict()
            user_role = user_data.get('role', 'patient')
            
            # Check if user is staff
            if user_role not in ['admin', 'staff', 'doctor', 'nurse', 'receptionist']:
                return jsonify({'success': False, 'error': 'Staff access required'}), 403
            
            # Get query parameters
            limit = request.args.get('limit', 50, type=int)
            status = request.args.get('status')  # Optional filter by status
            
            # Query appointments
            appointments_ref = db.collection('appointments')
            
            # Filter by status if provided
            if status:
                appointments_ref = appointments_ref.where(
                    filter=FieldFilter('status', '==', status)
                )
            
            appointments_ref = appointments_ref.order_by('createdAt', direction='DESCENDING').limit(limit)
            
            appointments = []
            for doc in appointments_ref.stream():
                appointment_data = doc.to_dict()
                appointment_data['id'] = doc.id
                
                # Convert datetime fields
                for field in ['createdAt', 'updatedAt', 'appointmentDate', 'checkedInAt', 'completedAt']:
                    if field in appointment_data and hasattr(appointment_data[field], 'isoformat'):
                        appointment_data[field] = appointment_data[field].isoformat()
                
                appointments.append(appointment_data)
            
            logger.info(f"✅ Staff {user_id} retrieved {len(appointments)} appointments")
            
            return jsonify({
                'success': True,
                'data': {
                    'appointments': appointments,
                    'count': len(appointments)
                }
            }), 200
            
        except Exception as e:
            logger.error(f"❌ Get appointments error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': 'Failed to get appointments'}), 500


    # =========================================================================
    # STAFF STATS/DASHBOARD DATA
    # =========================================================================
    
    @app.route('/api/staff/stats', methods=['GET', 'OPTIONS'])
    @auth_required
    def get_staff_stats():
        """Staff: Get dashboard statistics"""
        if request.method == 'OPTIONS':
            return ('', 204)
        
        try:
            user_id = request.user_id
            db = get_db()
            
            # Get current user to check role
            user_doc = db.collection('users').document(user_id).get()
            if not user_doc.exists:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            user_data = user_doc.to_dict()
            user_role = user_data.get('role', 'patient')
            
            # Check if user is staff
            if user_role not in ['admin', 'staff', 'doctor', 'nurse', 'receptionist']:
                return jsonify({'success': False, 'error': 'Staff access required'}), 403
            
            # Get counts
            total_patients = len(list(db.collection('users').where(
                filter=FieldFilter('role', '==', 'patient')
            ).limit(1000).stream()))
            
            total_appointments = len(list(db.collection('appointments').limit(1000).stream()))
            
            pending_appointments = len(list(db.collection('appointments').where(
                filter=FieldFilter('status', '==', 'pending')
            ).limit(1000).stream()))
            
            stats = {
                'totalPatients': total_patients,
                'totalAppointments': total_appointments,
                'pendingAppointments': pending_appointments,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            logger.info(f"✅ Staff {user_id} retrieved stats")
            
            return jsonify({'success': True, 'data': stats}), 200
            
        except Exception as e:
            logger.error(f"❌ Get stats error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': 'Failed to get stats'}), 500

    
    logger.info("✅ Staff routes registered successfully")