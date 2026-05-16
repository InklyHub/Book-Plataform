import resend
from app.core.config import settings


def _build_reset_email(reset_url: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Recupera tu contraseña</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ff;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3ff;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
          style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(109,40,217,.08);">

          <!-- Header -->
          <tr>
            <td align="center"
              style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:36px 40px 28px;">
              <div style="display:inline-block;background:rgba(255,255,255,.15);
                border-radius:12px;padding:12px 16px;margin-bottom:16px;">
                <span style="font-size:28px;">📖</span>
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-.3px;">
                Inkly
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h2 style="margin:0 0 12px;color:#111827;font-size:20px;font-weight:700;">
                Recupera tu contraseña
              </h2>
              <p style="margin:0 0 24px;color:#6b7280;font-size:15px;line-height:1.6;">
                Recibimos una solicitud para restablecer la contraseña de tu cuenta.
                Haz clic en el botón de abajo para crear una nueva contraseña.
                Este enlace es válido durante <strong>15 minutos</strong>.
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:8px 0 32px;">
                    <a href="{reset_url}"
                      style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);
                        color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;
                        padding:14px 36px;border-radius:10px;letter-spacing:.2px;">
                      Restablecer contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
              </p>
              <p style="margin:0;word-break:break-all;">
                <a href="{reset_url}" style="color:#7c3aed;font-size:13px;">{reset_url}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;color:#9ca3af;font-size:12px;text-align:center;line-height:1.6;">
                Si no solicitaste este cambio, ignora este email.<br/>
                Tu contraseña no será modificada.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


async def send_password_reset_email(to_email: str, reset_url: str) -> None:
    if not settings.RESEND_API_KEY:
        return

    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({
            "from": settings.RESEND_FROM_EMAIL,
            "to": [to_email],
            "subject": "Recupera tu contraseña — Inkly",
            "html": _build_reset_email(reset_url),
        })
    except Exception as e:
        if settings.ENVIRONMENT == "development":
            print(f"[DEV] Email no enviado ({e}). Usa el reset_token de la respuesta.")
        else:
            raise
