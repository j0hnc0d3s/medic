def get_password_reset_email(code, reset_id):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .code {{ font-size: 32px; font-weight: bold; color: #2E8B57; text-align: center; margin: 20px 0; }}
            .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Password Reset Request</h2>
            <p>Hello!</p>
            <p>You requested to reset your password for your Medic account. Use the verification code below to proceed:</p>
            
            <div class="code">{code}</div>
            
            <p>This code will expire in 15 minutes for security reasons.</p>
            <p>If you didn't request this reset, please ignore this email or contact support if you have concerns.</p>
            
            <div class="footer">
                <p>Best regards,<br>The Medic Team</p>
                <p>© 2024 3urek4. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_password_changed_email():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
        </style>
    </head>

    <body>
        <div class="container">
            <h2>Password Changed Successfully</h2>
            <p>Hello!</p>
            <p>Your Medic account password has been successfully changed.</p>
            
            <p>If you did not make this change, please contact our support team immediately.</p>
            
            <div class="footer">
                <p>Best regards,<br>The FreshFoods Team</p>
                <p>© 2024 3urek4. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """

def get_queue_code_email(code, queue_entry_name=None):
    greeting = f"Hi {queue_entry_name}," if queue_entry_name else "Hello!"
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .code {{ font-size: 32px; font-weight: bold; color: #0066ff; text-align: center;
                     letter-spacing: 6px; margin: 20px 0; }}
            .footer {{ margin-top: 30px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>Your Queue Code</h2>
            <p>{greeting}</p>
            <p>Thanks for submitting your information. Use the code below on the
               "Queue up" screen to join the queue:</p>

            <div class="code">{code}</div>

            <p>This code expires in 30 minutes. If it expires before you use it,
               you can look up your appointment again using your name, date of
               birth, and phone number.</p>

            <div class="footer">
                <p>Best regards,<br>The Medic Team</p>
                <p>© 2024 3urek4. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """