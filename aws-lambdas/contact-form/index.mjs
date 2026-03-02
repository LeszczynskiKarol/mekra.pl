// contact-form/index.mjs
// Lambda: mekra-contact
// Przetwarza formularz kontaktowy i wysyła email przez SES

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION || "eu-central-1";
const SES_REGION = "us-east-1";
const ses = new SESClient({ region: SES_REGION });
const s3 = new S3Client({ region: REGION });

const BUCKET = process.env.BUCKET_NAME || "mekra-attachments";
const TO_EMAIL = "kontakt@mekra.pl";
const FROM_EMAIL = "formularz@mekra.pl";
const FROM_NAME = "Mekra.pl";

const ALLOWED_ORIGINS = [
  "https://www.mekra.pl",
  "https://mekra.pl",
  "http://localhost:4321",
];

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

export const handler = async (event) => {
  const origin = event.headers?.origin || "";
  const allowOrigin = ALLOWED_ORIGINS.includes(origin)
    ? origin
    : "https://www.mekra.pl";

  const headers = {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.requestContext?.http?.method === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const {
      name,
      email,
      phone,
      message,
      productType, // rodzaj frontu
      dimensions, // wymiary
      attachments,
    } = body;

    // Walidacja
    if (!name || !email || !message) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "Brak wymaganych pól (name, email, message)",
        }),
      };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Nieprawidłowy adres email" }),
      };
    }

    // Generuj linki do pobrania załączników (ważne 7 dni)
    let attachmentsHtml = "";
    if (attachments && attachments.length > 0) {
      const attachmentLinks = [];
      for (const att of attachments) {
        try {
          const command = new GetObjectCommand({
            Bucket: BUCKET,
            Key: att.key,
          });
          const downloadUrl = await getSignedUrl(s3, command, {
            expiresIn: 7 * 24 * 60 * 60,
          });
          attachmentLinks.push(
            `<li style="margin-bottom:4px"><a href="${downloadUrl}" style="color:#866751;text-decoration:underline">${escapeHtml(att.name)}</a> <span style="color:#aaa;font-size:12px">(${formatSize(att.size || 0)})</span></li>`,
          );
        } catch (err) {
          console.error("Error generating download URL for:", att.key, err);
          attachmentLinks.push(
            `<li>${escapeHtml(att.name)} — <em style="color:#999">błąd generowania linku</em></li>`,
          );
        }
      }
      attachmentsHtml = `
        <tr>
          <td style="padding:12px 20px;font-family:'Georgia',serif;font-weight:600;color:#1a1a1a;vertical-align:top;width:140px;border-bottom:1px solid #e8e3db">Załączniki:</td>
          <td style="padding:12px 20px;font-family:'Georgia',serif;color:#555;border-bottom:1px solid #e8e3db">
            <ul style="margin:0;padding-left:20px;list-style:none">${attachmentLinks.join("")}</ul>
            <p style="font-size:11px;color:#aaa;margin-top:6px">Linki ważne 7 dni</p>
          </td>
        </tr>`;
    }

    // Email HTML — Mekra design: warm wood tones, refined aesthetic
    const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Georgia','Times New Roman',serif;background:#fafaf8">
  <div style="max-width:620px;margin:0 auto;padding:32px 16px">
    
    <!-- Header -->
    <div style="border-top:3px solid #866751;padding-top:16px;margin-bottom:8px">
      <table style="width:100%"><tr>
        <td style="font-family:'Georgia',serif;font-size:20px;font-weight:600;color:#1a1a1a;letter-spacing:-0.02em">
          <span style="display:inline-block;width:28px;height:28px;background:#866751;color:#fff;text-align:center;line-height:28px;border-radius:6px;font-size:16px;margin-right:8px;vertical-align:middle">M</span>
          Mekra
        </td>
        <td style="text-align:right;font-family:sans-serif;font-size:10px;color:#aaa;letter-spacing:0.08em;text-transform:uppercase">Nowe zapytanie</td>
      </tr></table>
    </div>
    <div style="border-bottom:1px solid #d4c5ae;margin-bottom:24px"></div>

    <!-- Title -->
    <h1 style="font-family:'Georgia',serif;font-size:22px;font-weight:600;color:#1a1a1a;margin:0 0 6px;line-height:1.3">Nowe zapytanie o fronty ramiakowe</h1>
    <p style="font-family:sans-serif;font-size:11px;color:#aaa;margin:0 0 24px;letter-spacing:0.04em">${new Date().toLocaleDateString("pl-PL", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>

    <!-- Data table -->
    <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e8e3db">
      <tr>
        <td style="padding:12px 20px;font-family:'Georgia',serif;font-weight:600;color:#1a1a1a;width:140px;border-bottom:1px solid #e8e3db">Nadawca:</td>
        <td style="padding:12px 20px;font-family:'Georgia',serif;color:#555;border-bottom:1px solid #e8e3db">${escapeHtml(name)}</td>
      </tr>
      <tr>
        <td style="padding:12px 20px;font-family:'Georgia',serif;font-weight:600;color:#1a1a1a;border-bottom:1px solid #e8e3db">Email:</td>
        <td style="padding:12px 20px;border-bottom:1px solid #e8e3db">
          <a href="mailto:${escapeHtml(email)}" style="color:#866751;text-decoration:underline;font-family:'Georgia',serif">${escapeHtml(email)}</a>
        </td>
      </tr>
      ${
        phone
          ? `<tr>
        <td style="padding:12px 20px;font-family:'Georgia',serif;font-weight:600;color:#1a1a1a;border-bottom:1px solid #e8e3db">Telefon:</td>
        <td style="padding:12px 20px;font-family:'Georgia',serif;color:#555;border-bottom:1px solid #e8e3db">${escapeHtml(phone)}</td>
      </tr>`
          : ""
      }
      ${
        productType
          ? `<tr>
        <td style="padding:12px 20px;font-family:'Georgia',serif;font-weight:600;color:#1a1a1a;border-bottom:1px solid #e8e3db">Rodzaj frontu:</td>
        <td style="padding:12px 20px;font-family:'Georgia',serif;color:#555;border-bottom:1px solid #e8e3db">
          <span style="background:rgba(134,103,81,0.1);color:#866751;padding:3px 10px;font-size:13px;border-radius:4px">${escapeHtml(productType)}</span>
        </td>
      </tr>`
          : ""
      }
      ${
        dimensions
          ? `<tr>
        <td style="padding:12px 20px;font-family:'Georgia',serif;font-weight:600;color:#1a1a1a;border-bottom:1px solid #e8e3db">Wymiary:</td>
        <td style="padding:12px 20px;font-family:'Georgia',serif;color:#555;border-bottom:1px solid #e8e3db">${escapeHtml(dimensions)}</td>
      </tr>`
          : ""
      }
      <tr>
        <td style="padding:12px 20px;font-family:'Georgia',serif;font-weight:600;color:#1a1a1a;vertical-align:top;border-bottom:1px solid #e8e3db">Wiadomość:</td>
        <td style="padding:12px 20px;font-family:'Georgia',serif;color:#555;line-height:1.65;border-bottom:1px solid #e8e3db">${escapeHtml(message).replace(/\n/g, "<br>")}</td>
      </tr>
      ${attachmentsHtml}
    </table>

    <!-- Reply button -->
    <div style="text-align:center;padding:28px 0">
      <a href="mailto:${escapeHtml(email)}?subject=Re: Zapytanie o fronty — Mekra.pl" 
         style="display:inline-block;padding:12px 32px;background:#866751;color:#fff;text-decoration:none;font-family:'Georgia',serif;font-size:14px;border-radius:6px">
        Odpowiedz na zapytanie →
      </a>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e8e3db;padding-top:12px;text-align:center">
      <p style="font-family:sans-serif;font-size:10px;color:#aaa;letter-spacing:0.06em;text-transform:uppercase">
        Formularz kontaktowy · Mekra.pl · Producent frontów ramiakowych
      </p>
    </div>
  </div>
</body>
</html>`;

    const command = new SendEmailCommand({
      Source: `${FROM_NAME} <${FROM_EMAIL}>`,
      Destination: { ToAddresses: [TO_EMAIL] },
      ReplyToAddresses: [email],
      Message: {
        Subject: {
          Data: `Nowe zapytanie: ${name}${productType ? " — " + productType : ""}`,
          Charset: "UTF-8",
        },
        Body: {
          Html: { Data: htmlBody, Charset: "UTF-8" },
        },
      },
    });

    await ses.send(command);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error("Contact form error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Błąd wysyłania wiadomości" }),
    };
  }
};
