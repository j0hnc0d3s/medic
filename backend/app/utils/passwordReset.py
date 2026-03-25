import random
import string
from datetime import datetime, timedelta
from app.config.firebase import db  # Fixed import path

class PasswordResetManager:
    def __init__(self):
        self.reset_codes = {}  # In production, use Redis or database

    def generate_reset_code(self):
        """Generate a 6-digit numeric code"""
        return ''.join(random.choices(string.digits, k=6))

    def create_reset_request(self, email):
        """Create a password reset request and store it"""
        # Check if user exists
        user_ref = db.collection('users').where('email', '==', email).limit(1).get()
        if not user_ref:
            return None, None
            
        # Generate reset code
        reset_code = self.generate_reset_code()
        expires_at = datetime.now() + timedelta(minutes=15)  # Code expires in 15 mins
        
        # Store reset request
        reset_data = {
            'email': email,
            'code': reset_code,
            'expires_at': expires_at,
            'used': False,
            'created_at': datetime.now()
        }
        
        # Store in Firestore
        reset_ref = db.collection('password_resets').document()
        reset_ref.set(reset_data)
        
        return reset_code, reset_ref.id

    def verify_reset_code(self, reset_id, code):
        """Verify if the reset code is valid"""
        try:
            reset_ref = db.collection('password_resets').document(reset_id)
            reset_data = reset_ref.get()
            
            if not reset_data.exists:
                return False, "Invalid reset request"
                
            reset_info = reset_data.to_dict()
            
            # Check if code is already used
            if reset_info.get('used'):
                return False, "Reset code already used"
                
            # Check if code matches
            if reset_info.get('code') != code:
                return False, "Invalid reset code"
                
            # Check if code is expired
            expires_at = reset_info['expires_at']
            if datetime.now() > expires_at:
                return False, "Reset code expired"
                
            return True, "Code verified successfully"
            
        except Exception as e:
            return False, f"Verification error: {str(e)}"

    def mark_code_used(self, reset_id):
        """Mark a reset code as used"""
        reset_ref = db.collection('password_resets').document(reset_id)
        reset_ref.update({'used': True})

# Initialize password reset manager
reset_manager = PasswordResetManager()