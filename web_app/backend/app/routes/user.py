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
    
 