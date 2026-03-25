import os
from dotenv import load_dotenv
import logging

load_dotenv()

class EmailService:
    def __init__(self):
        # Resend configuration (preferred - easiest!)
        self.resend_api_key = os.getenv('RESEND_API_KEY')
        self.use_resend = bool(self.resend_api_key)
        
        # Gmail SMTP configuration (fallback 2)
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', 587))
        self.smtp_username = os.getenv('SMTP_USERNAME')
        self.smtp_password = os.getenv('SMTP_PASSWORD')
        
        self.from_email = os.getenv('FROM_EMAIL', 'noreply@mirri.com')
        self.from_name = os.getenv('FROM_NAME', 'Mirri')
        
        # Debug: Log configuration
        print("=" * 60)
        print("📧 Email Service Configuration:")
        if self.use_resend:
            print("✅ Using Resend (HTTP API) - RECOMMENDED!")
            print(f"   API Key Set: {'✅ Yes' if self.resend_api_key else '❌ No'}")
            print(f"   From: {self.from_name} <{self.from_email}>")
        else:
            print("⚠️  Using Gmail SMTP (may not work on Railway)")
            print(f"   SMTP Server: {self.smtp_server}:{self.smtp_port}")
            print(f"   Username: {self.smtp_username}")
            print(f"   Password Set: {'✅ Yes' if self.smtp_password else '❌ No'}")
        print("=" * 60)

    def send_email(self, to_email, subject, html_content, text_content=None):
        """
        Send email using Resend (preferred), SendGrid, or Gmail SMTP
        """
        print(f"\n📧 Attempting to send email to: {to_email}")
        print(f"Subject: {subject}")
        
        # Validate inputs
        if not to_email or not subject or not html_content:
            print("❌ Missing required email parameters")
            return False
        
        # Try Resend first (best option!)
        if self.use_resend:
            return self._send_via_resend(to_email, subject, html_content, text_content)
        
        # Fall back to SMTP
        else:
            print("⚠️  No API-based email service configured, using SMTP")
            return self._send_via_smtp(to_email, subject, html_content)

    def _send_via_resend(self, to_email, subject, html_content, text_content=None):
        """
        Send email via Resend HTTP API
        """
        try:
            # Import Resend (only when needed)
            import resend
            
            print("📨 Using Resend to send email...")
            
            # Set API key
            resend.api_key = self.resend_api_key
            
            # Prepare email params
            params = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }
            
            # Add text version if provided
            if text_content:
                params["text"] = text_content
            
            # Send email
            response = resend.Emails.send(params)
            
            print(f"✅ Resend Response: {response}")
            
            if response and 'id' in response:
                print(f"✅ Email sent successfully to {to_email} via Resend")
                print(f"   Email ID: {response['id']}")
                return True
            else:
                print(f"⚠️  Unexpected Resend response: {response}")
                return False
                
        except ImportError:
            print("❌ Resend library not installed!")
            print("💡 Run: pip install resend")
            return False
            
        except Exception as e:
            print(f"❌ Resend error: {str(e)}")
            print(f"Error type: {type(e).__name__}")
            
            # Print full traceback for debugging
            import traceback
            traceback.print_exc()
            
            # Try SendGrid or SMTP as fallback
            if self.sendgrid_api_key:
                print("🔄 Falling back to SendGrid...")
                return self._send_via_sendgrid(to_email, subject, html_content)
            elif self.smtp_username and self.smtp_password:
                print("🔄 Falling back to Gmail SMTP...")
                return self._send_via_smtp(to_email, subject, html_content)
            
            return False

    def _send_via_smtp(self, to_email, subject, html_content):
        """
        Send email via Gmail SMTP (fallback method)
        """
        if not self.smtp_username or not self.smtp_password:
            print("❌ SMTP credentials not configured")
            return False
        
        try:
            import smtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart
            
            # Create message
            msg = MIMEMultipart('alternative')
            msg['From'] = f"{self.from_name} <{self.from_email}>"
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Attach HTML content
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            print(f"📨 Connecting to {self.smtp_server}:{self.smtp_port}...")
            
            # Create SMTP connection with timeout
            server = smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=30)
            server.set_debuglevel(0)
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(self.smtp_username, self.smtp_password)
            server.sendmail(self.from_email, to_email, msg.as_string())
            server.quit()
            
            print(f"✅ Email sent successfully to {to_email} via SMTP")
            return True
            
        except OSError as e:
            if e.errno == 101:
                print(f"❌ Network is unreachable - Railway is blocking SMTP!")
            else:
                print(f"❌ Network Error: {str(e)}")
            return False
            
        except Exception as e:
            print(f"❌ SMTP error: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def test_connection(self):
        """
        Test email service connection
        """
        print("\n🧪 Testing email service connection...")
        
        if self.use_resend:
            return self._test_resend()
        else:
            print("⚠️  No API-based service to test (using SMTP)")
            return False

    def _test_resend(self):
        """Test Resend API connection"""
        try:
            import resend
            
            resend.api_key = self.resend_api_key
            
            # Test by getting API key info (doesn't send email)
            # Resend doesn't have a direct test endpoint, so we'll just verify the key is set
            print("✅ Resend API key is configured")
            print("💡 Send a test email to verify it works!")
            return True
            
        except ImportError:
            print("❌ Resend library not installed!")
            return False
            
        except Exception as e:
            print(f"❌ Resend test failed: {str(e)}")
            return False

# Initialize email service
email_service = EmailService()