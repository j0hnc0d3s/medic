# app/middleware/roleRequired.py
from functools import wraps
from flask import request, jsonify
from firebase_admin import auth
from app.config.firebase import get_db
import logging

logger = logging.getLogger(__name__)

def role_required(allowed_roles):
    """
    Decorator to check if user has one of the allowed roles
    Usage: @role_required(['admin', 'staff'])
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Get Authorization header
            auth_header = request.headers.get('Authorization')
            
            if not auth_header or not auth_header.startswith('Bearer '):
                return jsonify({
                    'success': False,
                    'error': 'No authorization token provided'
                }), 401
            
            # Extract token
            id_token = auth_header.split('Bearer ')[1]
            
            try:
                # Verify Firebase token
                decoded_token = auth.verify_id_token(id_token)
                user_id = decoded_token['uid']
                
                # Get user from Firestore to check role
                db = get_db()
                user_ref = db.collection('users').document(user_id)
                user_doc = user_ref.get()
                
                if not user_doc.exists:
                    return jsonify({
                        'success': False,
                        'error': 'User not found'
                    }), 404
                
                user_data = user_doc.to_dict()
                user_role = user_data.get('role', 'patient')  # Default to patient
                
                # Check if user has required role
                if user_role not in allowed_roles:
                    logger.warning(f"User {user_id} with role '{user_role}' attempted to access endpoint requiring {allowed_roles}")
                    return jsonify({
                        'success': False,
                        'error': f'Access denied. Required role: {", ".join(allowed_roles)}'
                    }), 403
                
                # Add user info to request for use in route
                request.user_id = user_id
                request.user_role = user_role
                request.user_data = user_data
                
                return f(*args, **kwargs)
                
            except auth.InvalidIdTokenError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid authentication token'
                }), 401
            except Exception as e:
                logger.error(f"Role verification error: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'Authentication failed'
                }), 500
        
        return decorated_function
    return decorator


def admin_required(f):
    """Shorthand decorator for admin-only endpoints"""
    return role_required(['admin'])(f)


def staff_required(f):
    """Shorthand decorator for staff-only endpoints (includes doctor, nurse, receptionist)"""
    return role_required(['admin', 'staff', 'doctor', 'nurse', 'receptionist'])(f)


def patient_required(f):
    """Shorthand decorator for patient-only endpoints"""
    return role_required(['patient'])(f)
