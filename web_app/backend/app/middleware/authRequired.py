# app/middleware/authRequired.py - WITH DETAILED DEBUGGING
from functools import wraps
from flask import request, jsonify
from firebase_admin import auth
import logging
from app.config.firebase import get_db

logger = logging.getLogger(__name__)

def auth_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            if request.method == 'OPTIONS':
                return ('', 204)  # Return empty response for preflight
            
            # Get Authorization header
            auth_header = request.headers.get('Authorization')
            
            if not auth_header:
                logger.warning("❌ No Authorization header found — 2, I'm in auth_required")
                return jsonify({
                    'success': False, 
                    'error': 'Authentication required'
                }), 401
            
            if not auth_header.startswith('Bearer '):
                logger.warning("❌ Invalid Authorization header format — 2, I'm in auth_required")
                return jsonify({
                    'success': False, 
                    'error': 'Invalid authentication format'
                }), 401
            
            # Extract token
            id_token = auth_header.split('Bearer ')[1]
            
            # Handle mock tokens (development only)
            if id_token.startswith('mock_token_'):
                user_id = id_token.replace('mock_token_', '')
                logger.info(f"🔧 Processing mock token for user: {user_id}")
                
                # Verify user exists in database
                db = get_db()
                user_ref = db.collection('users').document(user_id).get()
                
                if not user_ref.exists:
                    logger.error(f"❌ Mock token user not found - 2, I'm in auth_required: {user_id}")
                    return jsonify({
                        'success': False, 
                        'error': 'Invalid user'
                    }), 401
                
                user_data = user_ref.to_dict()
                
                # ✅ FRESHFOODS STYLE: Store in request object
                request.user_id = user_id
                request.user_data = user_data
                
                logger.info(f"✅ Mock token authenticated: {user_data.get('email')}")
                
            else:
                # Handle Firebase tokens (production)
                try:
                    decoded_token = auth.verify_id_token(id_token)
                    user_id = decoded_token['uid']
                    
                    request.user_id = user_id
                    
                    # Get user data from Firestore
                    db = get_db()
                    user_ref = db.collection('users').document(user_id).get()
                    
                    if user_ref.exists:
                        request.user_data = user_ref.to_dict()
                        logger.info(f"✅ Firebase token authenticated: {request.user_data.get('email')}")
                    else:
                        # Create minimal user data if Firestore record doesn't exist
                        request.user_data = {
                            'email': decoded_token.get('email'),
                            'uid': user_id
                        }
                        logger.info(f"✅ Firebase token authenticated (no Firestore record): {decoded_token.get('email')}")
                        
                except Exception as firebase_error:
                    logger.error(f"❌ Firebase token verification failed — 2, I'm in auth_required: {firebase_error}")
                    return jsonify({
                        'success': False, 
                        'error': 'Invalid Firebase token'
                    }), 401
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"❌ Authentication middleware error — 2, I'm in auth_required: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False, 
                'error': 'Authentication failed'
            }), 401
    
    return decorated_function

def get_user_id():

    """
    Helper function to get user ID from Authorization header.
    Supports both mock and Firebase tokens.
    Returns user_id or None if not authenticated.
    """
    
    try:
        logger.error("🔍 get_user_id() called")  # Use error so it shows up!
        
        auth_header = request.headers.get('Authorization')
        logger.error(f"🔑 Auth header present: {bool(auth_header)}")
        
        if not auth_header or not auth_header.startswith('Bearer '):
            logger.error("❌ No auth header or doesn't start with Bearer")
            return None
        
        id_token = auth_header.split('Bearer ')[1]
        logger.error(f"🎫 Token extracted (first 20 chars): {id_token[:20]}...")
        
        # Handle mock tokens
        if id_token.startswith('mock_token_'):
            logger.error("🔧 Mock token detected")
            user_id = id_token.replace('mock_token_', '')
            
            db = get_db()
            user_ref = db.collection('users').document(user_id).get()
            result = user_id if user_ref.exists else None
            logger.error(f"✅ Mock token result: {result}")
            return result
        
        # Handle Firebase tokens
        logger.error("🔥 Attempting Firebase token verification...")
        try:
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token['uid']
            logger.error(f"✅ Firebase token verified! User: {user_id}")
            return user_id
        except Exception as e:
            logger.error(f"❌ Token verification FAILED: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return None
            
    except Exception as e:
        logger.error(f"❌ Error in get_user_id: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return None