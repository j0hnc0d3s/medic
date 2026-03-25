# app/routes/user.py - Updated for Medic with Role Support

from flask import request, jsonify
from datetime import datetime, timezone
from app.config.firebase import get_db
from app.middleware.authRequired import auth_required
from app.middleware.roleRequired import role_required, admin_required, staff_required
import logging

logger = logging.getLogger(__name__)

def register_routes(app):
    """Register all user routes for Medic"""
    
    # =========================================================================
    # CURRENT USER PROFILE
    # =========================================================================
    
    @app.route('/api/users/me', methods=['GET', 'OPTIONS'])
    @auth_required
    def get_current_user():
        """Get current user's profile"""
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            user_id = request.user_id
            db = get_db()
            user_ref = db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            user_data = user_doc.to_dict()
            user_data['uid'] = user_id
            
            # Convert datetime fields
            for field in ['createdAt', 'updatedAt', 'dob']:
                if field in user_data and hasattr(user_data[field], 'isoformat'):
                    user_data[field] = user_data[field].isoformat()
            
            return jsonify({'success': True, 'data': user_data}), 200
        except Exception as e:
            logger.error(f"Get user profile error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to get user profile'}), 500
    
    @app.route('/api/users/me', methods=['PUT', 'OPTIONS'])
    @auth_required
    def update_current_user():
        """Update current user's profile"""
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            user_id = request.user_id
            data = request.get_json()
            
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            db = get_db()
            user_ref = db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            # Allowed fields for patient to update
            allowed_fields = [
                'firstName', 'lastName', 'phone', 'dob', 'gender',
                'address', 'parish', 'trn', 'nis', 'profilePictureUrl'
            ]
            
            # Staff/Admin can update additional fields
            user_data = user_doc.to_dict()
            user_role = user_data.get('role', 'patient')
            
            if user_role in ['admin', 'staff', 'doctor', 'nurse', 'receptionist']:
                allowed_fields.extend(['department'])
            
            update_data = {}
            for field in allowed_fields:
                if field in data:
                    update_data[field] = data[field]
            
            if not update_data:
                return jsonify({'success': False, 'error': 'No valid fields to update'}), 400
            
            update_data['updatedAt'] = datetime.now(timezone.utc)
            user_ref.update(update_data)
            
            return jsonify({
                'success': True,
                'message': 'Profile updated successfully',
                'data': update_data
            }), 200
        except Exception as e:
            logger.error(f"Update profile error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to update profile'}), 500
    
    # =========================================================================
    # ROLE-SPECIFIC ENDPOINTS
    # =========================================================================
    
    @app.route('/api/users/role', methods=['GET', 'OPTIONS'])
    @auth_required
    def get_user_role():
        """Get current user's role"""
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            user_id = request.user_id
            db = get_db()
            user_ref = db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            user_data = user_doc.to_dict()
            role = user_data.get('role', 'patient')
            
            return jsonify({
                'success': True,
                'data': {
                    'role': role,
                    'department': user_data.get('department', '') if role in ['staff', 'doctor', 'nurse', 'receptionist'] else None
                }
            }), 200
        except Exception as e:
            logger.error(f"Get user role error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to get user role'}), 500
    
    # =========================================================================
    # STAFF-ONLY ENDPOINTS
    # =========================================================================
    
    @app.route('/api/staff/patients', methods=['GET', 'OPTIONS'])
    @staff_required
    def get_all_patients():
        """Staff: Get list of all patients"""
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            db = get_db()
            limit = request.args.get('limit', 50, type=int)
            
            # Query for patients only
            patients_ref = db.collection('users').where('role', '==', 'patient').limit(limit)
            
            patients = []
            for doc in patients_ref.stream():
                patient_data = doc.to_dict()
                patient_data['uid'] = doc.id
                
                # Convert datetime fields
                for field in ['createdAt', 'updatedAt', 'dob']:
                    if field in patient_data and hasattr(patient_data[field], 'isoformat'):
                        patient_data[field] = patient_data[field].isoformat()
                
                patients.append(patient_data)
            
            return jsonify({
                'success': True,
                'data': {
                    'patients': patients,
                    'count': len(patients)
                }
            }), 200
        except Exception as e:
            logger.error(f"Get patients error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to get patients'}), 500
    
    @app.route('/api/staff/patients/<patient_id>', methods=['GET', 'OPTIONS'])
    @staff_required
    def get_patient_details(patient_id):
        """Staff: Get specific patient details"""
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            db = get_db()
            user_ref = db.collection('users').document(patient_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return jsonify({'success': False, 'error': 'Patient not found'}), 404
            
            patient_data = user_doc.to_dict()
            
            # Verify it's a patient
            if patient_data.get('role') != 'patient':
                return jsonify({'success': False, 'error': 'Not a patient'}), 400
            
            patient_data['uid'] = patient_id
            
            # Convert datetime fields
            for field in ['createdAt', 'updatedAt', 'dob']:
                if field in patient_data and hasattr(patient_data[field], 'isoformat'):
                    patient_data[field] = patient_data[field].isoformat()
            
            return jsonify({'success': True, 'data': patient_data}), 200
        except Exception as e:
            logger.error(f"Get patient details error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to get patient details'}), 500
    
    # =========================================================================
    # ADMIN-ONLY ENDPOINTS
    # =========================================================================
    
    @app.route('/api/admin/users/assign-role', methods=['PUT', 'OPTIONS'])
    @admin_required
    def assign_user_role():
        """Admin: Assign or change user role"""
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            data = request.get_json()
            target_user_id = data.get('userId')
            new_role = data.get('role')
            
            if not target_user_id or not new_role:
                return jsonify({'success': False, 'error': 'userId and role are required'}), 400
            
            # Validate role
            valid_roles = ['admin', 'staff', 'doctor', 'nurse', 'receptionist', 'patient']
            if new_role not in valid_roles:
                return jsonify({'success': False, 'error': f'Invalid role. Must be one of: {", ".join(valid_roles)}'}), 400
            
            db = get_db()
            user_ref = db.collection('users').document(target_user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            # Update role
            update_data = {
                'role': new_role,
                'updatedAt': datetime.now(timezone.utc)
            }
            
            # If assigning staff role, optionally add department
            if new_role in ['staff', 'doctor', 'nurse', 'receptionist']:
                department = data.get('department')
                if department:
                    update_data['department'] = department
            
            user_ref.update(update_data)
            
            logger.info(f"✅ Admin assigned role '{new_role}' to user {target_user_id}")
            
            return jsonify({
                'success': True,
                'message': f'User role updated to {new_role}',
                'data': update_data
            }), 200
        except Exception as e:
            logger.error(f"Assign role error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to assign role'}), 500
    
    @app.route('/api/admin/users/deactivate/<user_id>', methods=['PUT', 'OPTIONS'])
    @admin_required
    def deactivate_user(user_id):
        """Admin: Deactivate a user account"""
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            # Prevent deactivating yourself
            if user_id == request.user_id:
                return jsonify({'success': False, 'error': 'Cannot deactivate your own account'}), 400
            
            db = get_db()
            user_ref = db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            user_ref.update({
                'isActive': False,
                'updatedAt': datetime.now(timezone.utc)
            })
            
            logger.info(f"✅ Admin deactivated user {user_id}")
            
            return jsonify({
                'success': True,
                'message': 'User deactivated successfully'
            }), 200
        except Exception as e:
            logger.error(f"Deactivate user error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to deactivate user'}), 500
    
    @app.route('/api/admin/users/activate/<user_id>', methods=['PUT', 'OPTIONS'])
    @admin_required
    def activate_user(user_id):
        """Admin: Activate a user account"""
        if request.method == 'OPTIONS':
            return ('', 204)
        try:
            db = get_db()
            user_ref = db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            user_ref.update({
                'isActive': True,
                'updatedAt': datetime.now(timezone.utc)
            })
            
            logger.info(f"✅ Admin activated user {user_id}")
            
            return jsonify({
                'success': True,
                'message': 'User activated successfully'
            }), 200
        except Exception as e:
            logger.error(f"Activate user error: {str(e)}")
            return jsonify({'success': False, 'error': 'Failed to activate user'}), 500