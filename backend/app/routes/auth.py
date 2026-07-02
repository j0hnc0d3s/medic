# app/routes/auth.py - Updated for Medic with Role Support
 
from flask import request, jsonify
from firebase_admin import auth
from datetime import datetime, timedelta, timezone
from app.config.firebase import get_db
from app.config.smtp import email_service
from app.utils.emailTemplates import get_welcome_email, get_password_reset_email
import secrets
import string
import logging
 
logger = logging.getLogger(__name__)
 
def generate_reset_code():
    """Generate a 6-digit reset code"""
    return ''.join(secrets.choice(string.digits) for _ in range(6))
 
def register_routes(app):
    """Register all auth routes for Medic"""
 
    # ============================================================================
    # REGISTRATION ENDPOINT - Updated for Medic
    # ============================================================================
 
    @app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
    def register():
        """Register new user with role assignment"""
        try:
            data = request.get_json()
            
            # Required fields
            email = data.get('email')
            password = data.get('password')
            
            if not email or not password:
                return jsonify({
                    'success': False,
                    'error': 'Email and password are required'
                }), 400
            
            if len(password) < 6:
                return jsonify({
                    'success': False,
                    'error': 'Password must be at least 6 characters'
                }), 400
            
            # Get user details
            first_name = data.get('firstName', '')
            last_name = data.get('lastName', '')
            phone = data.get('phone', '')
            
            # Role assignment - default to 'patient'
            # Admin can only be created by existing admin via admin panel
            role = data.get('role', 'patient')
            
            # Security: Only allow patient registration through public endpoint
            if role not in ['patient']:
                return jsonify({
                    'success': False,
                    'error': 'Invalid role. New users must register as patients.'
                }), 400
            
            # Create Firebase Auth user
            try:
                user = auth.create_user(
                    email=email,
                    password=password,
                    display_name=f"{first_name} {last_name}".strip()
                )
                uid = user.uid
                logger.info(f"✅ Firebase user created: {uid}")
            except auth.EmailAlreadyExistsError:
                return jsonify({
                    'success': False,
                    'error': 'Email already registered'
                }), 400
            except Exception as e:
                logger.error(f"❌ Firebase user creation failed: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': f'Account creation failed: {str(e)}'
                }), 500
            
            # Create Firestore user document
            db = get_db()
            user_data = {
                'email': email.lower(),
                'firstName': first_name,
                'lastName': last_name,
                'phone': phone,
                'role': role,
                'department': '',  # Only for staff
                'trn': '',  # Tax Registration Number (Jamaica)
                'nis': '',  # National Insurance Scheme (Jamaica)
                'dob': data.get('dob'),
                'gender': '',
                'address': '',
                'parish': '',  # Jamaican parish
                'profilePictureUrl': '',
                'isActive': True,
                'createdAt': datetime.now(timezone.utc),
                'updatedAt': datetime.now(timezone.utc),
            }
            
            db.collection('users').document(uid).set(user_data)
            logger.info(f"✅ Firestore user document created: {uid}")
            
            # Send welcome email
            try:
                email_service.send_email(
                    to_email=email,
                    subject="Welcome to Medic!",
                    html_content=get_welcome_email(first_name)
                )
                logger.info(f"✅ Welcome email sent to {email}")
            except Exception as email_error:
                logger.error(f"❌ Welcome email failed: {str(email_error)}")
            
            return jsonify({
                'success': True,
                'message': 'Account created successfully!',
                'user': {
                    'uid': uid,
                    'email': email,
                    'role': role
                }
            }), 201
            
        except Exception as e:
            logger.error(f"Registration error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'error': 'Registration failed'
            }), 500
 
    # ============================================================================
    # LOGIN ENDPOINT - Updated for Medic with Role Return
    # ============================================================================
 
    @app.route('/api/auth/login', methods=['POST', 'OPTIONS'])
    def login():
        """Login with Firebase token - verify and return user data with role"""
        try:
            data = request.get_json()
            id_token = data.get('token')  # Firebase ID token from frontend
            
            if not id_token:
                return jsonify({
                    'success': False,
                    'error': 'Firebase token is required'
                }), 400
            
            # Verify Firebase token
            try:
                decoded_token = auth.verify_id_token(id_token)
                user_id = decoded_token['uid']
                email = decoded_token.get('email')
                
                logger.info(f"✅ Firebase token verified for: {email}")
                
            except Exception as e:
                logger.error(f"❌ Firebase token verification failed: {str(e)}")
                return jsonify({
                    'success': False,
                    'error': 'Invalid authentication token'
                }), 401
            
            # Get user from Firestore
            db = get_db()
            user_ref = db.collection('users').document(user_id)
            user_doc = user_ref.get()
            
            if not user_doc.exists:
                # User not found in Firestore - shouldn't happen normally
                logger.error(f"❌ User not found in Firestore: {email}")
                return jsonify({
                    'success': False,
                    'error': 'User not found. Please contact support.'
                }), 404
            
            user_data = user_doc.to_dict()
            
            # Check if user is active
            if not user_data.get('isActive', True):
                return jsonify({
                    'success': False,
                    'error': 'Account is deactivated. Please contact support.'
                }), 403
            
            # Get user role
            user_role = user_data.get('role', 'patient')
            
            logger.info(f"✅ User logged in: {email} (role: {user_role})")
            
            # Return user data with role
            response_data = {
                'success': True,
                'user': {
                    'uid': user_id,
                    'email': user_data.get('email'),
                    'firstName': user_data.get('firstName', ''),
                    'lastName': user_data.get('lastName', ''),
                    'role': user_role,
                    'department': user_data.get('department', ''),  # For staff
                    'profilePictureUrl': user_data.get('profilePictureUrl', ''),
                },
                'token': id_token,
            }
            
            return jsonify(response_data), 200
            
        except Exception as e:
            logger.error(f"Login error: {str(e)}")
            import traceback
            traceback.print_exc()
            return jsonify({
                'success': False,
                'error': 'Login failed'
            }), 500
 
    # ============================================================================
    # Password Reset Endpoints (Keep your existing code)
    # ============================================================================
 
    @app.route('/api/auth/forgot-password', methods=['POST', 'OPTIONS'])
    def forgot_password():
        """Send password reset code to email"""
        try:
            data = request.get_json()
            email = data.get('email')
            
            if not email:
                return jsonify({
                    'success': False,
                    'error': 'Email is required'
                }), 400
            
            # Check if user exists in Firebase Auth
            try:
                user = auth.get_user_by_email(email)
            except Exception:
                # Don't reveal if email exists (security)
                return jsonify({
                    'success': True,
                    'message': 'If this email exists, a reset code has been sent'
                }), 200
            
            # Generate 4-digit code
            reset_code = generate_reset_code()
            
            # Calculate expiration (15 minutes)
            expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
            
            # Store code in Firestore
            db = get_db()
            reset_code_data = {
                'email': email.lower(),
                'code': reset_code,
                'used': False,
                'expires_at': expires_at,
                'created_at': datetime.now(timezone.utc)
            }
            
            reset_code_ref = db.collection('resetCodes').document()
            reset_code_ref.set(reset_code_data)
            
            logger.info(f"Generated reset code for {email}")
            
            # Send email with reset code
            try:
                email_service.send_email(
                    to_email=email,
                    subject="Medic - Password Reset Code",
                    html_content=f"""
                    <h1>Password Reset Request</h1>
                    <p>Your password reset code is:</p>
                    <h2 style="color: #1F4788; font-size: 32px; letter-spacing: 8px;">{reset_code}</h2>
                    <p>This code will expire in 15 minutes.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                    """
                )
                logger.info(f"Reset email sent to {email}")
            except Exception as email_error:
                logger.error(f"Email sending failed: {email_error}")
            
            return jsonify({
                'success': True,
                'message': 'Reset code sent to email'
            }), 200
            
        except Exception as e:
            logger.error(f"Forgot password error: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Failed to process password reset request'
            }), 500


    # ============================================================================
    # Step 2: Verify reset code
    # ============================================================================

    @app.route('/api/auth/verify-reset-code', methods=['POST', 'OPTIONS'])
    def verify_reset_code():
        """Verify the reset code"""
        try:
            data = request.get_json()
            email = data.get('email')
            code = data.get('code')
            
            if not email or not code:
                return jsonify({
                    'success': False,
                    'error': 'Email and code are required'
                }), 400
            
            db = get_db()
            
            # Query for matching code
            reset_codes_ref = db.collection('resetCodes')
            query = reset_codes_ref.where('email', '==', email.lower()) \
                                .where('code', '==', code) \
                                .where('used', '==', False) \
                                .limit(1)
            
            docs = list(query.stream())
            
            if not docs:
                return jsonify({
                    'success': False,
                    'error': 'Invalid or expired code'
                }), 400
            
            reset_code_doc = docs[0]
            code_data = reset_code_doc.to_dict()
            
            # Check expiration
            expires_at = code_data.get('expires_at')
            if expires_at and datetime.now(timezone.utc) > expires_at:
                return jsonify({
                    'success': False,
                    'error': 'Code has expired'
                }), 400
            
            # Mark as used
            reset_code_doc.reference.update({'used': True})
            
            logger.info(f"Reset code verified for {email}")
            
            return jsonify({
                'success': True,
                'message': 'Code verified successfully',
                'data': {
                    'token': reset_code_doc.id,
                    'email': email
                }
            }), 200
            
        except Exception as e:
            logger.error(f"Code verification error: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Verification failed'
            }), 500


    # ============================================================================
    # Step 3: Reset password
    # ============================================================================

    @app.route('/api/auth/reset-password', methods=['POST', 'OPTIONS'])
    def reset_password():
        """Reset password with verified code"""
        try:
            data = request.get_json()
            new_password = data.get('newPassword')
            reset_id = data.get('resetId')
            
            if not new_password or not reset_id:
                return jsonify({
                    'success': False,
                    'error': 'New password and reset ID are required'
                }), 400
            
            if len(new_password) < 6:
                return jsonify({
                    'success': False,
                    'error': 'Password must be at least 6 characters'
                }), 400
            
            db = get_db()
            
            # Get reset code document
            reset_code_ref = db.collection('resetCodes').document(reset_id)
            reset_code_doc = reset_code_ref.get()
            
            if not reset_code_doc.exists:
                return jsonify({
                    'success': False,
                    'error': 'Invalid reset session'
                }), 400
            
            code_data = reset_code_doc.to_dict()
            
            # Verify code was used (marked in step 2)
            if not code_data.get('used'):
                return jsonify({
                    'success': False,
                    'error': 'Code not verified'
                }), 400
            
            # Check expiration
            expires_at = code_data.get('expires_at')
            if expires_at and datetime.now(timezone.utc) > expires_at:
                return jsonify({
                    'success': False,
                    'error': 'Reset session expired'
                }), 400
            
            # Get email from reset code
            email = code_data.get('email')
            
            # Get user by email
            try:
                user_record = auth.get_user_by_email(email)
            except Exception:
                return jsonify({
                    'success': False,
                    'error': 'User not found'
                }), 404
            
            # Update password using Firebase Admin SDK
            auth.update_user(
                user_record.uid,
                password=new_password
            )
            
            # Delete reset code
            reset_code_ref.delete()
            
            logger.info(f"Password reset successful for {email}")
            
            return jsonify({
                'success': True,
                'message': 'Password reset successfully'
            }), 200
            
        except Exception as e:
            logger.error(f"Password reset error: {str(e)}")
            return jsonify({
                'success': False,
                'error': 'Failed to reset password'
            }), 500


    # ============================================================================
    # Testing & Debug endpoints (development only)
    # ============================================================================

    @app.route('/api/auth/test/reset-codes', methods=['GET', 'OPTIONS'])
    def list_reset_codes():
        """Development: List all reset codes"""
        try:
            db = get_db()
            codes_ref = db.collection('resetCodes')
            codes = []
            
            for doc in codes_ref.stream():
                code_data = doc.to_dict()
                code_data['id'] = doc.id
                codes.append(code_data)
            
            return jsonify({
                'success': True,
                'codes': codes
            }), 200
            
        except Exception as e:
            return jsonify({
                'success': False,
                'error': str(e)
            }), 500
        
    @app.route('/api/auth/test-email', methods=['POST'])
    def test_email():
        """Test Resend email"""
        try:
            data = request.get_json()
            test_email = data.get('email', 'josiahjohngreen@gmail.com')
            
            result = email_service.send_email(
                to_email=test_email,
                subject="Test Email from Mirri 🦆",
                html_content="<h1>Test successful!</h1>"
            )
            
            return jsonify({
                'success': result,
                'message': 'Check logs for details'
            })
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)})