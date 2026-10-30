# app/utils/emailTemplates.py
#
# Every patient-facing email shares one layout (_layout) so they all look
# like the Medic app: white card on the app's light grey background, the
# Medic banner and logo, Poppins type, blue pill buttons, black and grey text.
#
# Images are served from the web app's /email/ folder (frontend/public/email),
# because emails can only show images from a public web address. Set
# FRONTEND_URL on the backend if the web app lives somewhere else.
#
# Everything is inline-styled and table-based on purpose: email apps
# (Gmail, Outlook, Apple Mail) ignore most modern CSS. Poppins is requested
# but the stack falls back to Helvetica/Arial where it isn't available.
import os
from html import escape

FRONTEND_URL = os.environ.get('FRONTEND_URL', 'https://the-medic-system.vercel.app').rstrip('/')

BLUE = '#1a56db'
INK = '#1e293b'
SOFT = '#475569'
MUTED = '#9ca3af'
FONT = "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif"


def _p(text, size=14, color=SOFT, margin='0 0 16px'):
    return f'<p style="margin:{margin};font-size:{size}px;line-height:1.7;color:{color};font-family:{FONT};">{text}</p>'


def _code(code):
    return f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
      <tr><td align="center" style="background:#f1f3f5;border-radius:24px;padding:26px 16px;">
        <div style="font-family:{FONT};font-size:12px;font-weight:600;letter-spacing:1.5px;color:{MUTED};text-transform:uppercase;margin-bottom:8px;">Your code</div>
        <div style="font-family:{FONT};font-size:38px;font-weight:700;letter-spacing:10px;color:{BLUE};padding-left:10px;">{escape(str(code))}</div>
      </td></tr>
    </table>"""


def _button(label, url):
    return f"""
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 24px;">
      <tr><td align="center" style="background:{BLUE};border-radius:50px;">
        <a href="{url}" style="display:inline-block;padding:14px 34px;font-family:{FONT};font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">{label}</a>
      </td></tr>
    </table>"""


def _note(text):
    return f"""
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
      <tr><td style="background:#f8f9fa;border-radius:16px;padding:14px 18px;font-family:{FONT};font-size:12px;line-height:1.6;color:{SOFT};">{text}</td></tr>
    </table>"""


def _layout(preheader, title, subtitle, body_html):
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape(title)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#e9eaec;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#e9eaec;">{escape(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#e9eaec;">
    <tr><td align="center" style="padding:32px 12px;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 10px 30px rgba(0,0,0,0.06);">

        <tr><td style="padding:0;line-height:0;">
          <img src="{FRONTEND_URL}/email/banner.png" width="600" alt="medic. Digitising emergency triage" style="display:block;width:100%;height:auto;border:0;">
        </td></tr>

        <tr><td style="padding:34px 40px 8px;">
          <h1 style="margin:0;font-family:{FONT};font-size:26px;line-height:1.3;font-weight:700;color:{INK};">{title}</h1>
          <p style="margin:8px 0 0;font-family:{FONT};font-size:14px;line-height:1.6;color:{MUTED};">{subtitle}</p>
        </td></tr>

        <tr><td style="padding:22px 40px 30px;">
          {body_html}
        </td></tr>

        <tr><td style="padding:0 40px;"><div style="height:1px;background:#f1f3f5;line-height:1px;font-size:1px;">&nbsp;</div></td></tr>

        <tr><td style="padding:22px 40px 28px;">
          <table role="presentation" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;padding-right:12px;"><img src="{FRONTEND_URL}/email/logo.png" width="34" height="34" alt="Medic" style="display:block;border:0;"></td>
            <td style="vertical-align:middle;font-family:{FONT};font-size:12px;line-height:1.6;color:{MUTED};">
              <strong style="color:{INK};">The Medic Team</strong> at 3urek4<br>
              Digitising emergency triage &middot; Based in the Caribbean
            </td>
          </tr></table>
          <p style="margin:14px 0 0;font-family:{FONT};font-size:11px;color:{MUTED};">&copy; 2026 3urek4. All rights reserved.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>"""


def get_password_reset_email(code, reset_id):
    body = (
        _p("You asked to reset the password on your Medic account. Enter this code to continue:")
        + _code(code)
        + _p("This code expires in <strong>15 minutes</strong>, for your security.")
        + _note("If you didn't ask for this, you can ignore this email. Your password will stay exactly as it is.")
    )
    return _layout("Your Medic password reset code", "Reset your password",
                   "Hello! Here's your reset code.", body)


def get_password_changed_email():
    body = (
        _p("Your Medic account password has just been changed.")
        + _button("Sign in", f"{FRONTEND_URL}/login")
        + _note("If you didn't make this change, please contact our support team straight away.")
    )
    return _layout("Your Medic password was changed", "Password changed",
                   "Your account is all set.", body)


def get_queue_code_email(code, queue_entry_name=None):
    name = escape(queue_entry_name.strip()) if queue_entry_name and queue_entry_name.strip() else None
    greeting = f"Hi {name}, thanks for checking in." if name else "Thanks for checking in."
    body = (
        _p("Enter the code below on the <strong>Queue up</strong> screen to join the queue. "
           "It also confirms you're at the clinic, so only use it once you've arrived.")
        + _code(code)
        + _p("This code expires in <strong>30 minutes</strong>.")
        + _note("If it expires, or you've lost it, look up your appointment again using your name, "
                "date of birth and phone number, and we'll send you a new one.")
    )
    return _layout("Your Medic queue code", "Your queue code", greeting, body)


def get_welcome_email(first_name):
    name = escape((first_name or '').strip()) or 'there'

    def item(title, text):
        return f"""
        <tr>
          <td style="vertical-align:top;padding:0 12px 14px 0;"><div style="width:8px;height:8px;border-radius:50%;background:{BLUE};margin-top:7px;"></div></td>
          <td style="padding:0 0 14px;font-family:{FONT};font-size:13px;line-height:1.6;color:{SOFT};"><strong style="color:{INK};">{title}</strong> &mdash; {text}</td>
        </tr>"""

    features = (
        item("Join the queue remotely", "skip the front desk and check in from anywhere before you arrive.")
        + item("Track your position", "see live updates on where you are in the queue.")
        + item("Manage your appointments", "view and keep on top of your upcoming visits.")
        + item("Access your documents", "your records and results, available when you need them.")
        + item("Message your care team", "talk directly with your nurse or doctor.")
    )
    body = (
        _p(f"Hi {name},", size=16, color=INK)
        + _p("Your account has been created. Medic is built to make your healthcare experience smoother, "
             "faster and less stressful, starting from the moment you walk through the door.")
        + _p("Here's what you can do with your account:", margin='0 0 14px')
        + f'<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 12px;">{features}</table>'
        + _button("Get started", FRONTEND_URL)
        + _note("If you didn't create this account, you can safely ignore this email.")
    )
    return _layout("Welcome to Medic. Your account is ready.", f"Welcome to Medic, {name}!",
                   "Care without the wait.", body)
