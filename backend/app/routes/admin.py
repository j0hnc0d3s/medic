# app/routes/admin.py
from flask import request, jsonify
from firebase_admin import auth as firebase_auth
from datetime import datetime
from app.config.firebase import get_db
from app.middleware.authRequired import auth_required
from app.middleware.roleRequired import role_required, admin_required, staff_required
from google.cloud.firestore_v1.base_query import FieldFilter  # ✅ FIX Firestore warning
import logging

logger = logging.getLogger(__name__)


def require_admin(user_id):
    """Check if user is admin (currently disabled for testing)"""
    db = get_db()
    doc = db.collection('users').document(user_id).get()
    if not doc.exists:
        return None, (jsonify({'success': False, 'error': 'User not found'}), 401)
    # Uncomment to enforce admin role:
    # user_data = doc.to_dict()
    # if user_data.get('role') != 'admin':
    #     return None, (jsonify({'success': False, 'error': 'Admin access required'}), 403)
    return doc.to_dict(), None


def register_routes(app):
    """Register all admin routes"""
    
    logger.info("🔧 Registering admin routes...")

    # =========================================================================
    # USERS
    # =========================================================================

    @app.route('/api/admin/users', methods=['GET'], endpoint='admin_list_users')
    @auth_required
    def admin_list_users():
        """Get all users"""
        user_id = request.user_id
        try:
            _, err = require_admin(user_id)
            if err: return err

            db = get_db()
            limit = request.args.get('limit', 100, type=int)
            status = request.args.get('status')

            users = []
            for doc in db.collection('users').limit(limit).stream():
                data = doc.to_dict()
                data['uid'] = doc.id
                
                # Convert datetime fields
                for field in ('created_at', 'updated_at', 'dob', 'createdAt', 'updatedAt'):
                    if field in data and hasattr(data[field], 'isoformat'):
                        data[field] = data[field].isoformat()
                
                # Apply status filter
                if status == 'active' and not data.get('is_active', True):
                    continue
                if status == 'inactive' and data.get('is_active', True):
                    continue
                
                users.append(data)

            logger.info(f"✅ Listed {len(users)} users")
            return jsonify({'success': True, 'data': {'users': users, 'count': len(users)}}), 200
            
        except Exception as e:
            logger.error(f'❌ admin_list_users error: {e}')
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/admin/users', methods=['POST'], endpoint='admin_create_user')
    @auth_required
    def admin_create_user():
        """Create a new user"""
        user_id = request.user_id
        try:
            _, err = require_admin(user_id)
            if err: return err

            data = request.get_json()
            logger.info(f"📝 Create user request: {data.get('email')}")
            
            email = data.get('email')
            password = data.get('password')
            username = data.get('username')

            if not email or not password or not username:
                logger.warning(f"❌ Missing required fields: email={bool(email)}, password={bool(password)}, username={bool(username)}")
                return jsonify({'success': False, 'error': 'email, password and username are required'}), 400

            db = get_db()
            
            # ✅ FIXED: Use FieldFilter to avoid Firestore warning
            existing_users = list(db.collection('users').where(
                filter=FieldFilter('username', '==', username)
            ).limit(1).stream())
            
            if existing_users:
                logger.warning(f"❌ Username already taken: {username}")
                return jsonify({'success': False, 'error': 'Username already taken'}), 400

            # Create Firebase Auth user
            firebase_user = firebase_auth.create_user(
                email=email,
                password=password,
                display_name=f"{data.get('firstName', '')} {data.get('lastName', '')}".strip()
            )
            new_uid = firebase_user.uid
            logger.info(f"✅ Created Firebase user: {new_uid}")
            
            # Create Firestore user document
            user_data = {
                'email': email.lower(),
                'username': username,
                'firstName': data.get('firstName', ''),
                'lastName': data.get('lastName', ''),
                'phone': data.get('phone', ''),
                'country': data.get('country', ''),
                'gender': data.get('gender', ''),
                'role': data.get('role', 'user'),
                'balance': int(data.get('balance', 0)),
                'food': int(data.get('food', 10)),
                'is_active': True,
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow(),
            }
            db.collection('users').document(new_uid).set(user_data)
            logger.info(f"✅ Created Firestore user doc: {new_uid}")
            
            # ✅ FIXED: Create mascot at /mascot/default (not /mascot/main)
            db.collection('users').document(new_uid).collection('mascot').document('default').set({
                'mascotEmotion': 'HAPPY',
                'mascotHappiness': 2,
                'mascotComment': 'Hello! I am so happy to meet you! 🦆',
                'lastFedTime': datetime.utcnow(),
                'createdAt': datetime.utcnow(),
                'updatedAt': datetime.utcnow(),
            })
            logger.info(f"✅ Created mascot at /mascot/default for user: {new_uid}")
            
            user_data['uid'] = new_uid
            return jsonify({'success': True, 'message': 'User created', 'data': user_data}), 201
            
        except Exception as e:
            logger.error(f'❌ admin_create_user error: {e}')
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/admin/users/<target_uid>', methods=['GET'], endpoint='admin_get_user')
    @auth_required
    def admin_get_user(target_uid):
        """Get a specific user"""
        user_id = request.user_id
        try:
            _, err = require_admin(user_id)
            if err: return err
            
            db = get_db()
            doc = db.collection('users').document(target_uid).get()
            
            if not doc.exists:
                logger.warning(f"❌ User not found: {target_uid}")
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            data = doc.to_dict()
            data['uid'] = target_uid
            
            # Convert datetime fields
            for field in ('created_at', 'updated_at', 'dob', 'createdAt', 'updatedAt'):
                if field in data and hasattr(data[field], 'isoformat'):
                    data[field] = data[field].isoformat()
            
            logger.info(f"✅ Retrieved user: {target_uid}")
            return jsonify({'success': True, 'data': data}), 200
            
        except Exception as e:
            logger.error(f'❌ admin_get_user error: {e}')
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/admin/users/<target_uid>', methods=['PUT'], endpoint='admin_update_user')
    @auth_required
    def admin_update_user(target_uid):
        """Update a user"""
        user_id = request.user_id
        try:
            _, err = require_admin(user_id)
            if err: return err
            
            data = request.get_json()
            if not data:
                return jsonify({'success': False, 'error': 'No data provided'}), 400
            
            db = get_db()
            ref = db.collection('users').document(target_uid)
            
            if not ref.get().exists:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            # Allowed fields
            allowed = ['firstName', 'lastName', 'username', 'phone', 'country', 'gender', 'dob', 'role', 'balance', 'food', 'is_active']
            update = {k: data[k] for k in allowed if k in data}
            
            if not update:
                return jsonify({'success': False, 'error': 'No valid fields'}), 400
            
            update['updatedAt'] = datetime.utcnow()
            ref.update(update)
            
            logger.info(f"✅ Updated user: {target_uid}")
            return jsonify({'success': True, 'message': 'User updated', 'data': update}), 200
            
        except Exception as e:
            logger.error(f'❌ admin_update_user error: {e}')
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500

    @app.route('/api/admin/users/<target_uid>', methods=['DELETE'], endpoint='admin_delete_user')
    @auth_required
    def admin_delete_user(target_uid):
        """Delete a user"""
        user_id = request.user_id
        try:
            _, err = require_admin(user_id)
            if err: return err
            
            if target_uid == user_id:
                return jsonify({'success': False, 'error': 'Cannot delete yourself'}), 400
            
            db = get_db()
            ref = db.collection('users').document(target_uid)
            
            if not ref.get().exists:
                return jsonify({'success': False, 'error': 'User not found'}), 404
            
            # Delete subcollections
            for sub in ('mascot', 'tasks', 'entries', 'coins', 'food', 'scores', 'purchases'):
                for doc in ref.collection(sub).stream():
                    doc.reference.delete()
            
            # Delete user document
            ref.delete()
            
            # Delete from Firebase Auth
            try:
                firebase_auth.delete_user(target_uid)
            except Exception as auth_err:
                logger.warning(f'Firebase Auth delete failed: {auth_err}')
            
            logger.info(f"✅ Deleted user: {target_uid}")
            return jsonify({'success': True, 'message': 'User deleted'}), 200
            
        except Exception as e:
            logger.error(f'❌ admin_delete_user error: {e}')
            import traceback
            traceback.print_exc()
            return jsonify({'success': False, 'error': str(e)}), 500
        
    
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