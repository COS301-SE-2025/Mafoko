# app/services/email_service.py
import httpx
import os
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()


class EmailService:
    """Service for sending emails via Resend API."""

    def __init__(self):
        self.api_key = os.getenv("RESEND_API_KEY")
        self.base_url = "https://api.resend.com"
        self.from_email = os.getenv("FROM_EMAIL", "noreply@mavito.com")

    async def send_password_reset_email(
        self, to_email: str, reset_token: str, user_name: str
    ) -> bool:
        """Send password reset email to user."""
        if not self.api_key:
            raise ValueError("RESEND_API_KEY not configured")

        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"

        email_data = {
            "from": self.from_email,
            "to": [to_email],
            "subject": "Reset Your Mavito Password",
            "html": self._generate_password_reset_html(user_name, reset_url),
            "text": self._generate_password_reset_text(user_name, reset_url),
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/emails",
                    json=email_data,
                    headers=headers,
                    timeout=10.0,
                )
                return response.status_code == 200
            except httpx.RequestError:
                return False

    def _generate_password_reset_html(self, user_name: str, reset_url: str) -> str:
        """Generate HTML email content for password reset."""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password - Mavito</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
                <h2 style="color: #2c3e50; margin: 0;">Password Reset Request</h2>
            </div>

            <p>Hello {user_name},</p>

            <p>We received a request to reset your password for your Mavito account. If you made this request, click the button below to reset your password:</p>

            <div style="text-align: center; margin: 30px 0;">
                <a href="{reset_url}"
                   style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Reset Your Password
                </a>
            </div>

            <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">{reset_url}</p>

            <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p style="margin: 0; color: #856404;"><strong>Security Note:</strong> This link will expire in 1 hour for your security.</p>
            </div>

            <p>If you didn't request this password reset, you can safely ignore this email. Your password will not be changed.</p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">

            <p style="color: #666; font-size: 12px;">
                This email was sent by Mavito. If you have any questions, please contact our support team.
            </p>
        </body>
        </html>
        """

    def _generate_password_reset_text(self, user_name: str, reset_url: str) -> str:
        """Generate plain text email content for password reset."""
        return f"""
        Password Reset Request - Mavito

        Hello {user_name},

        We received a request to reset your password for your Mavito account.

        To reset your password, please click the following link:
        {reset_url}

        This link will expire in 1 hour for your security.

        If you didn't request this password reset, you can safely ignore this email.
        Your password will not be changed.

        Best regards,
        The Mavito Team
        """


email_service = EmailService()
