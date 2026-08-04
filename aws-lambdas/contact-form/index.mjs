// contact-form/index.mjs
// Lambda: mekra-contact
// Przetwarza formularz kontaktowy i wysyła email przez SES

import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import nodemailer from "nodemailer";
import { randomUUID } from "node:crypto";

const REGION = process.env.AWS_REGION || "eu-central-1";
const SES_REGION = "us-east-1";
const ses = new SESClient({ region: SES_REGION });
const s3 = new S3Client({ region: REGION });
const secrets = new SecretsManagerClient({ region: REGION });

const BUCKET = process.env.BUCKET_NAME || "mekra-attachments";
const TO_EMAIL = "kontakt@mekra.pl";
const FROM_EMAIL = "formularz@mekra.pl";
const FROM_NAME = "Mekra.pl";

// Configuration set kieruje zdarzenia dostarczenia na SNS (temat mekra-ses-events).
// Bez tego odbicie na serwerze odbiorcy ginie po cichu: SES loguje "OK" po przyjęciu
// wiadomości do wysyłki, a to, czy serwer docelowy ją przyjął, widać dopiero w zdarzeniu.
const CONFIG_SET = process.env.SES_CONFIG_SET || "mekra-events";

// Druga kopia leada na niezależnego dostawcę. 30.07.2026 zapytanie odbiło się na
// serwerze cyber-folks (SES: Bounce, zero Delivery) i przepadło — jedynym śladem był
// panel leadów. Kopia idzie kopertą (bez Cc/Bcc w nagłówkach), więc każdy odbiorca
// ma osobną sesję SMTP: odrzucenie u jednego nie dotyka drugiego.
const BACKUP_EMAIL = process.env.SES_BACKUP_TO || "karolleszczynskikorektor@gmail.com";

// Poczta na kontakt@ NIE idzie już przez SES. Powód (04.08.2026): MX mekra.pl to
// s1.cyber-folks.pl, który filtruje przez hostkarma.junkemailfilter.com, a tam
// oflagowanych jest 15 z 16 adresów puli nadawczej SES (54.240.8.80–95; .88 wprost
// na czarnej liście). SES losuje adres przy każdej wysyłce, więc leady ginęły
// losowo — potwierdzony bounce 30.07 i 04.08. CyberFolks odmówił whitelisty
// (zgłoszenie 04.08.2026), a delisting cudzych IP Amazona nie jest w naszej mocy.
//
// Zamiast tego logujemy się na ich własny serwer jako formularz@mekra.pl i wysyłamy
// stamtąd: dostarczenie do kontakt@mekra.pl jest wtedy LOKALNE (ta sama maszyna),
// więc żaden RBL nie jest w ogóle odpytywany. Hasło leży w Secrets Manager, nie
// w zmiennych Lambdy — te są czytelne dla każdego z dostępem do konsoli.
const SMTP_SECRET_ID = process.env.SMTP_SECRET_ID || "mekra/smtp-formularz";

let smtpPromise = null;
function getTransport() {
  // Cache na czas życia kontenera: sekret i połączenie przeżywają kolejne wywołania.
  // Przy błędzie czyścimy cache, żeby następne wywołanie spróbowało od nowa
  // (inaczej jeden nieudany start zatruwałby kontener aż do recyklingu).
  if (!smtpPromise) {
    smtpPromise = secrets
      .send(new GetSecretValueCommand({ SecretId: SMTP_SECRET_ID }))
      .then((r) => {
        const cfg = JSON.parse(r.SecretString);
        return nodemailer.createTransport({
          host: cfg.host,
          port: cfg.port || 465,
          secure: cfg.secure !== false,
          auth: { user: cfg.user, pass: cfg.pass },
          // Lambda ma 60 s timeoutu, a wysyłka to tylko część pracy — nie wolno
          // przy niedostępnym serwerze zjeść całego budżetu i zgubić kopii na Gmailu.
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 20000,
        });
      })
      .catch((err) => {
        smtpPromise = null;
        throw err;
      });
  }
  return smtpPromise;
}

// Gotowy surowy MIME idzie na serwer bez przepakowania — nagłówki, załączniki
// i Message-ID zostają dokładnie takie, jakie zbudował buildRawEmail.
async function sendViaSmtp(raw, to) {
  const transport = await getTransport();
  return transport.sendMail({ envelope: { from: FROM_EMAIL, to: [to] }, raw });
}

// Załączniki wchodzą do maila jako realne pliki MIME, więc zostają w skrzynce
// na zawsze i nie zależą od presigned URL (te wygasają razem z sesją roli Lambdy).
// Powyżej progu SES odrzuciłby wiadomość (limit 40 MB na surowy mail, a base64
// puchnie o ~37%) — wtedy lecą same linki, jak dawniej.
const MAX_INLINE_TOTAL = 20 * 1024 * 1024;

const MIME_TYPES = {
  pdf: "application/pdf",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  dwg: "image/vnd.dwg",
  dxf: "image/vnd.dxf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  zip: "application/zip",
  txt: "text/plain",
};

function mimeFor(filename) {
  const ext = String(filename || "").split(".").pop().toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

// Nazwa pliku pochodzi od użytkownika i trafia do nagłówków MIME — bez tego
// CR/LF w nazwie pozwoliłby wstrzyknąć własne nagłówki do wiadomości.
function sanitizeFilename(name) {
  return String(name || "zalacznik")
    .replace(/[\r\n"\\]/g, "")
    .slice(0, 200)
    .trim() || "zalacznik";
}

// RFC 2047 — nagłówki muszą być ASCII, a polskie znaki w nazwach plików
// i w temacie są tu normą.
function encodeHeader(str) {
  const s = String(str || "");
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  return `=?UTF-8?B?${Buffer.from(s, "utf8").toString("base64")}?=`;
}

function base64Lines(buffer) {
  return buffer.toString("base64").replace(/(.{76})/g, "$1\r\n");
}

// Treść (tekst/HTML) kodujemy quoted-printable, nie base64 — filtry antyspamowe
// (reguły typu MIME_BASE64_TEXT) traktują tekst w base64 jako maskowanie treści.
// Base64 zostaje wyłącznie dla binarnych załączników.
function qpEncode(str) {
  const bytes = Buffer.from(String(str).replace(/\r?\n/g, "\r\n"), "utf8");
  let out = "", line = "";
  const push = (tok) => { if (line.length + tok.length > 75) { out += line + "=\r\n"; line = ""; } line += tok; };
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b === 13 && bytes[i + 1] === 10) { // koniec linii; spacja/tab na końcu musi być zakodowana
      if (/[ \t]$/.test(line)) { const c = line.slice(-1); line = line.slice(0, -1); push(c === " " ? "=20" : "=09"); }
      out += line + "\r\n"; line = ""; i++;
    } else if (b === 61) push("=3D");
    else if ((b >= 33 && b <= 126) || b === 32 || b === 9) push(String.fromCharCode(b));
    else push("=" + b.toString(16).toUpperCase().padStart(2, "0"));
  }
  return out + line;
}

// Mail wyłącznie w HTML podpada pod regułę MIME_HTML_ONLY — dokładamy równoległą
// wersję tekstową w multipart/alternative.
function htmlToText(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|h\d)>/gi, "\n")
    .replace(/<\/td>/gi, "\t")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}

async function fetchAttachment(key) {
  const res = await s3.send(
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
  );
  return Buffer.from(await res.Body.transformToByteArray());
}

// RFC 5322 wymaga Date, a brak Date/Message-ID to mocny sygnał spamu dla filtrów.
// SendEmail dodawał te nagłówki sam — przy SendRawEmail musimy je złożyć my.
function rfc2822Date(d) {
  const D = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const p = (n) => String(n).padStart(2, "0");
  return `${D[d.getUTCDay()]}, ${p(d.getUTCDate())} ${M[d.getUTCMonth()]} ${d.getUTCFullYear()} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} +0000`;
}

function buildRawEmail({ subject, replyTo, htmlBody, files }) {
  const boundary = `----=_Mekra_${randomUUID()}`;
  // Domena Message-ID musi zgadzać się z domeną From (DKIM/DMARC alignment).
  const fromDomain = FROM_EMAIL.split("@")[1] || "mekra.pl";
  const headers = [
    `From: ${encodeHeader(FROM_NAME)} <${FROM_EMAIL}>`,
    `To: ${TO_EMAIL}`,
    `Reply-To: ${replyTo}`,
    `Subject: ${encodeHeader(subject)}`,
    `Date: ${rfc2822Date(new Date())}`,
    `Message-ID: <${randomUUID()}@${fromDomain}>`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].join("\r\n");

  // multipart/alternative: ta sama treść jako tekst i jako HTML, oba w QP.
  const altBoundary = `----=_Alt_${randomUUID()}`;
  const parts = [
    [
      `--${boundary}`,
      `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
      "",
      `--${altBoundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      "Content-Transfer-Encoding: quoted-printable",
      "",
      qpEncode(htmlToText(htmlBody)),
      `--${altBoundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      "Content-Transfer-Encoding: quoted-printable",
      "",
      qpEncode(htmlBody),
      `--${altBoundary}--`,
    ].join("\r\n"),
  ];

  for (const file of files) {
    const name = sanitizeFilename(file.name);
    parts.push(
      [
        `--${boundary}`,
        `Content-Type: ${mimeFor(name)}; name="${encodeHeader(name)}"`,
        "Content-Transfer-Encoding: base64",
        `Content-Disposition: attachment; filename="${encodeHeader(name)}"`,
        "",
        base64Lines(file.body),
      ].join("\r\n"),
    );
  }

  return `${headers}\r\n\r\n${parts.join("\r\n")}\r\n--${boundary}--\r\n`;
}

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

    // Załączniki: pliki dołączamy do maila na stałe, a link zostaje pod spodem
    // jako zapas (działa tylko chwilę, ale nic nie kosztuje i ratuje sytuację,
    // gdyby plik nie zmieścił się w mailu).
    let attachmentsHtml = "";
    const inlineFiles = [];
    if (attachments && attachments.length > 0) {
      const attachmentRows = [];
      let inlineTotal = 0;

      for (const att of attachments) {
        let attached = false;
        const size = att.size || 0;

        if (inlineTotal + size <= MAX_INLINE_TOTAL) {
          try {
            const body = await fetchAttachment(att.key);
            inlineFiles.push({ name: att.name, body });
            inlineTotal += body.length;
            attached = true;
          } catch (err) {
            console.error("Nie udało się pobrać załącznika:", att.key, err);
          }
        } else {
          console.warn("Załącznik pominięty (limit rozmiaru maila):", att.key, size);
        }

        let linkHtml = "";
        try {
          const downloadUrl = await getSignedUrl(
            s3,
            new GetObjectCommand({ Bucket: BUCKET, Key: att.key }),
            { expiresIn: 7 * 24 * 60 * 60 },
          );
          linkHtml = ` <a href="${downloadUrl}" style="color:#866751;text-decoration:underline;font-size:12px">pobierz z serwera</a>`;
        } catch (err) {
          console.error("Error generating download URL for:", att.key, err);
        }

        attachmentRows.push(
          `<li style="margin-bottom:4px">${
            attached ? "📎 " : ""
          }${escapeHtml(att.name)} <span style="color:#aaa;font-size:12px">(${formatSize(size)})</span>${
            attached ? "" : " — <em style='color:#999;font-size:12px'>za duży, tylko link</em>"
          }${linkHtml}</li>`,
        );
      }

      const note = inlineFiles.length
        ? "Pliki oznaczone 📎 są dołączone do tej wiadomości — zostają w skrzynce na stałe. Linki działają krótko i służą tylko awaryjnie."
        : "Linki działają krótko — pliki są przechowywane na serwerze przez rok.";

      attachmentsHtml = `
        <tr>
          <td style="padding:12px 20px;font-family:'Georgia',serif;font-weight:600;color:#1a1a1a;vertical-align:top;width:140px;border-bottom:1px solid #e8e3db">Załączniki:</td>
          <td style="padding:12px 20px;font-family:'Georgia',serif;color:#555;border-bottom:1px solid #e8e3db">
            <ul style="margin:0;padding-left:20px;list-style:none">${attachmentRows.join("")}</ul>
            <p style="font-size:11px;color:#aaa;margin-top:6px">${note}</p>
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

    const rawMessage = buildRawEmail({
      subject: `Nowe zapytanie: ${name}${productType ? " — " + productType : ""}`,
      replyTo: email,
      htmlBody,
      files: inlineFiles,
    });

    const rawBuffer = Buffer.from(rawMessage, "utf8");
    const sendViaSes = (to) =>
      ses.send(new SendRawEmailCommand({
        Source: `${FROM_NAME} <${FROM_EMAIL}>`,
        Destinations: [to],
        RawMessage: { Data: rawBuffer },
        ConfigurationSetName: CONFIG_SET,
      }));

    // Dwa niezależne kanały równolegle — awaria jednego nie może dotknąć drugiego,
    // dlatego allSettled, a nie all.
    const backupEnabled = BACKUP_EMAIL && BACKUP_EMAIL !== TO_EMAIL;
    const [primary, backup] = await Promise.allSettled([
      sendViaSmtp(rawMessage, TO_EMAIL),
      backupEnabled ? sendViaSes(BACKUP_EMAIL) : Promise.resolve(null),
    ]);

    let primaryOk = primary.status === "fulfilled";
    if (primaryOk) {
      console.log("SMTP OK (cyber-folks) to:", TO_EMAIL, "messageId:", primary.value?.messageId);
    } else {
      // Awaryjnie i tak próbujemy SES-em: część puli nadawczej bywa przepuszczana,
      // więc szansa na dostarczenie jest niezerowa i lepsza niż cisza.
      console.error("SMTP FAIL to:", TO_EMAIL, primary.reason);
      try {
        const r = await sendViaSes(TO_EMAIL);
        primaryOk = true;
        console.warn("SES fallback uzyty dla:", TO_EMAIL, "MessageId:", r.MessageId);
      } catch (err) {
        console.error("SES fallback tez padl dla:", TO_EMAIL, err);
      }
    }

    const backupOk = backup.status === "fulfilled";
    if (backupEnabled && !backupOk) console.error("SES kopia FAIL:", BACKUP_EMAIL, backup.reason);

    console.log(
      "Lead wyslany — kontakt:", primaryOk ? "OK" : "BLAD",
      "kopia:", backupEnabled ? (backupOk ? "OK" : "BLAD") : "wylaczona",
      "replyTo:", email,
      "attached:", inlineFiles.length,
      "rawBytes:", rawBuffer.length,
    );

    // 500 tylko gdy lead nie dotarł ŻADNYM kanałem — wtedy front pokaże błąd
    // i klient wie, że ma zadzwonić. Jeden działający kanał to sukces.
    if (!primaryOk && !backupOk) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Błąd wysyłania wiadomości" }),
      };
    }

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
