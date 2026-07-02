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

def get_welcome_email(first_name):
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap');
            body {{ font-family: 'Poppins', Arial, sans-serif; margin: 0; padding: 0; background: #f1f3f5; }}
            .wrapper {{ max-width: 600px; margin: 40px auto; background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.08); }}
            .header {{ background: linear-gradient(135deg, #0066ff 0%, #1e88ff 100%); padding: 40px 40px 32px; }}
            .logo {{ font-size: 13px; color: rgba(255,255,255,0.8); font-weight: 600; letter-spacing: 1px; margin: 0 0 16px; }}
            .header-title {{ font-size: 28px; font-weight: 700; color: #fff; margin: 0; line-height: 1.3; }}
            .header-sub {{ font-size: 14px; color: rgba(255,255,255,0.85); margin: 8px 0 0; }}
            .body {{ padding: 36px 40px; }}
            .greeting {{ font-size: 16px; color: #1e293b; margin: 0 0 16px; }}
            .body p {{ font-size: 14px; color: #475569; line-height: 1.7; margin: 0 0 16px; }}
            .feature-list {{ list-style: none; padding: 0; margin: 24px 0; }}
            .feature-list li {{ display: flex; align-items: flex-start; gap: 12px; font-size: 13px; color: #475569; margin-bottom: 14px; }}
            .feature-dot {{ width: 8px; height: 8px; border-radius: 50%; background: #0066ff; flex-shrink: 0; margin-top: 5px; }}
            .cta {{ display: inline-block; background: #0066ff; color: #fff; text-decoration: none; font-weight: 600; font-size: 14px; padding: 14px 32px; border-radius: 50px; margin: 8px 0 24px; }}
            .footer {{ border-top: 1px solid #f1f3f5; padding: 24px 40px; }}
            .footer p {{ font-size: 11px; color: #9ca3af; margin: 0; line-height: 1.6; }}
        </style>
    </head>
    <body>
        <div class="wrapper">
            <div class="header">
                <p class="logo">✻ MEDIC</p>
                <h1 class="header-title">Welcome to Medic,<br>{first_name}!</h1>
                <p class="header-sub">Care without the wait.</p>
            </div>

            <div class="body">
                <p class="greeting">Hi {first_name},</p>
                <p>
                    Your account has been created successfully. We're glad to have you on board.
                    Medic is designed to make your healthcare experience smoother, faster, and
                    less stressful — starting from the moment you walk through the door.
                </p>

                <p>Here's what you can do with your account:</p>

                <ul class="feature-list">
                    <li>
                        <span class="feature-dot"></span>
                        <span><strong>Join the queue remotely</strong> — skip the front desk and check in from anywhere before you arrive.</span>
                    </li>
                    <li>
                        <span class="feature-dot"></span>
                        <span><strong>Track your position</strong> — see real-time updates on where you are in the queue.</span>
                    </li>
                    <li>
                        <span class="feature-dot"></span>
                        <span><strong>Manage your appointments</strong> — view, track, and stay on top of your upcoming visits.</span>
                    </li>
                    <li>
                        <span class="feature-dot"></span>
                        <span><strong>Access your documents</strong> — your medical records and documents, available when you need them.</span>
                    </li>
                    <li>
                        <span class="feature-dot"></span>
                        <span><strong>Message your care team</strong> — communicate directly with your nurse or doctor.</span>
                    </li>
                </ul>

                <p>
                    If you have any questions or need help getting started, don't hesitate to
                    reach out to us.
                </p>

                <a class="cta" href="https://medic-clinic.vercel.app">Get started</a>

                <p style="font-size:13px; color:#9ca3af;">
                    If you didn't create this account, you can safely ignore this email.
                </p>
            </div>

            <div class="footer">
                <p>Best regards,<br><strong>The Medic Team</strong> at 3urek4</p>
                <p style="margin-top:8px;">© 2026 3urek4. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """