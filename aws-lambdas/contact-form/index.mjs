// contact-form/index.mjs
// Lambda: mekra-contact
// Przetwarza formularz kontaktowy i wysyła email przez SES

import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import nodemailer from "nodemailer";
import Stripe from "stripe";
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

function buildRawEmail({ subject, replyTo, htmlBody, files = [], to = TO_EMAIL }) {
  const boundary = `----=_Mekra_${randomUUID()}`;
  // Domena Message-ID musi zgadzać się z domeną From (DKIM/DMARC alignment).
  const fromDomain = FROM_EMAIL.split("@")[1] || "mekra.pl";
  const headers = [
    `From: ${encodeHeader(FROM_NAME)} <${FROM_EMAIL}>`,
    `To: ${to}`,
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

// ============================================================================
// ZAMÓWIENIA (/order/session, /order/submit, /order/webhook) — kreator
// /zamowienie/ na mekra.pl. Płatność: Stripe Checkout (na razie tryb TESTOWY).
// Zamówienia trafiają do panelu panel.mekra.pl przez API meblowe-galleries-api
// (konto klient) — autoryzacja wspólnym kluczem orderKey, nie IAM.
// ============================================================================

const PANEL_API = process.env.PANEL_API || "https://elk3bw9gj4.execute-api.eu-central-1.amazonaws.com";
const STRIPE_SECRET_ID = process.env.STRIPE_SECRET_ID || "mekra/stripe";

// Sekret mekra/stripe: { secretKey, webhookSecret, orderKey } — cache jak SMTP.
let stripeCfgPromise = null;
function getStripeCfg() {
  if (!stripeCfgPromise) {
    stripeCfgPromise = secrets
      .send(new GetSecretValueCommand({ SecretId: STRIPE_SECRET_ID }))
      .then((r) => {
        const cfg = JSON.parse(r.SecretString);
        cfg.client = new Stripe(cfg.secretKey);
        return cfg;
      })
      .catch((err) => {
        stripeCfgPromise = null;
        throw err;
      });
  }
  return stripeCfgPromise;
}

async function panelOrder(cfg, method, payload, query = "") {
  const res = await fetch(`${PANEL_API}/order${query}`, {
    method,
    headers: { "Content-Type": "application/json", "x-order-key": cfg.orderKey },
    body: method === "GET" ? undefined : JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`panel /order ${method} HTTP ${res.status}`);
  return res.json();
}

// Cennik liczony PO STRONIE SERWERA — klient przysyła tylko dane wejściowe.
// Jedyna wartość z frontu, której ufamy warunkowo, to cena arkusza (katalog
// arkuszy jest na razie poglądowy po stronie strony) — stąd twarde widełki.
const ORDER_PRICING = {
  m2Fee: 150, minM2: 4, belowMinPct: 30, grainMatchPct: 20, vatPct: 23,
  maxM2: 500, maxSheetPrice: 5000,
  addons: {
    glassSmall:  { price: 190, name: "Front ze szkłem — mały" },
    mirrorSmall: { price: 250, name: "Front z lustrem — mały" },
    glassLarge:  { price: 300, name: "Front ze szkłem — duży" },
    mirrorLarge: { price: 400, name: "Front z lustrem — duży" },
    angle45:     { price: 60,  name: "Zacinanie na 45°" },
  },
};

// Pozycje zamówienia (dekory) z frontu — sanityzacja i twarde widełki. Gdy
// pozycja ma formatki, jej m² liczone jest z wymiarów, nie z wartości klienta.
function normPositions(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 20)
    .map((p) => {
      const formatki = normFormatki(p?.formatki);
      const m2 = formatki.length ? formatkiM2(formatki) : Math.round(((Number(p?.m2) || 0)) * 100) / 100;
      return {
        producer: {
          id: String(p?.producer?.id || "").slice(0, 40),
          name: String(p?.producer?.name || "").slice(0, 60),
          sheetFormat: String(p?.producer?.sheetFormat || "").slice(0, 30),
          sheetAreaM2: Number(p?.producer?.sheetAreaM2) || 5.8,
        },
        sheet: {
          code: String(p?.sheet?.code || "").slice(0, 40),
          name: String(p?.sheet?.name || "").slice(0, 80),
          finish: String(p?.sheet?.finish || "").slice(0, 40),
          price: Number(p?.sheet?.price) || 0,
        },
        ramka: String(p?.ramka || "").slice(0, 20),
        formatki, m2Mode: formatki.length ? "formatki" : "manual", m2,
      };
    })
    .filter((p) => p.sheet.code && p.sheet.price > 0 && p.sheet.price <= ORDER_PRICING.maxSheetPrice
      && p.m2 > 0 && p.m2 <= ORDER_PRICING.maxM2);
}

// Wycena całego zamówienia: arkusze per pozycja; wykonanie (150 zł/m²),
// minimum logistyczne i słój przechodzący — od SUMY m² wszystkich pozycji.
function computeOrderPricing(positions, addons, grain) {
  if (!positions.length) return null;
  const m2 = Math.round(positions.reduce((s, p) => s + p.m2, 0) * 100) / 100;
  if (m2 <= 0 || m2 > ORDER_PRICING.maxM2) return null;
  const posLines = positions.map((p) => {
    const sheets = Math.max(1, Math.ceil(p.m2 / p.producer.sheetAreaM2));
    return { name: p.sheet.name, code: p.sheet.code, producerName: p.producer.name,
      m2: p.m2, sheets, sheetPrice: p.sheet.price, sheetsCost: sheets * p.sheet.price };
  });
  const sheetsCost = posLines.reduce((s, l) => s + l.sheetsCost, 0);
  const laborCost = m2 * ORDER_PRICING.m2Fee;
  let addonsCost = 0;
  const addonLines = [];
  for (const [id, def] of Object.entries(ORDER_PRICING.addons)) {
    const qty = Math.max(0, Math.min(500, parseInt(addons?.[id], 10) || 0));
    if (qty > 0) {
      addonsCost += qty * def.price;
      addonLines.push({ id, name: def.name, qty, value: qty * def.price });
    }
  }
  const base = sheetsCost + laborCost + addonsCost;
  const grainCost = grain ? (base * ORDER_PRICING.grainMatchPct) / 100 : 0;
  const belowMin = m2 < ORDER_PRICING.minM2 ? (base * ORDER_PRICING.belowMinPct) / 100 : 0;
  const net = Math.round((base + grainCost + belowMin) * 100) / 100;
  const gross = Math.round(net * (1 + ORDER_PRICING.vatPct / 100) * 100) / 100;
  return { m2, posLines, sheetsCost, laborCost, addonLines, grainCost, belowMin,
    net, gross, grossGr: Math.round(gross * 100) };
}

// Formatki z frontu: sanityzacja + twarde widełki (50–2800 mm, max 200 pozycji).
// Gdy klient podał formatki, powierzchnia liczona jest TU — z wymiarów, nie
// z wartości m² przysłanej przez przeglądarkę.
function normFormatki(list) {
  if (!Array.isArray(list)) return [];
  return list.slice(0, 200)
    .map((r) => ({
      w: Math.round(Number(r?.w) || 0),
      h: Math.round(Number(r?.h) || 0),
      qty: Math.max(1, Math.min(500, parseInt(r?.qty, 10) || 0)),
    }))
    .filter((r) => r.w >= 50 && r.w <= 2800 && r.h >= 50 && r.h <= 2800);
}

function formatkiM2(formatki) {
  const sum = formatki.reduce((s, r) => s + (r.w * r.h * r.qty) / 1e6, 0);
  return Math.round(sum * 100) / 100;
}

function validContact(c) {
  if (!c) return false;
  const req = ["name", "email", "phone", "street", "zip", "city"];
  if (!req.every((f) => c[f] && String(c[f]).trim())) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(c.email));
}

// bez sztucznych ",00" — grosze tylko gdy naprawdę występują (spójnie z formularzem)
const zl = (n) => (Number(n) || 0).toLocaleString("pl-PL", { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + " zł";
const m2pl = (v) => (Number(v) || 0).toLocaleString("pl-PL", { maximumFractionDigits: 2 });

function orderRow(label, value) {
  return `<tr>
    <td style="padding:10px 20px;font-family:'Georgia',serif;font-weight:600;color:#1a1a1a;width:180px;border-bottom:1px solid #e8e3db;vertical-align:top">${label}</td>
    <td style="padding:10px 20px;font-family:'Georgia',serif;color:#555;border-bottom:1px solid #e8e3db">${value}</td>
  </tr>`;
}

// Wspólny szkielet maila zamówieniowego w stylu maili leadowych Mekra.
function orderEmailHtml({ title, intro, rows, footNote }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Georgia','Times New Roman',serif;background:#fafaf8">
  <div style="max-width:620px;margin:0 auto;padding:32px 16px">
    <div style="border-top:3px solid #866751;padding-top:16px;margin-bottom:8px">
      <table style="width:100%"><tr>
        <td style="font-family:'Georgia',serif;font-size:20px;font-weight:600;color:#1a1a1a">
          <span style="display:inline-block;width:28px;height:28px;background:#866751;color:#fff;text-align:center;line-height:28px;border-radius:6px;font-size:16px;margin-right:8px;vertical-align:middle">M</span>
          Mekra
        </td>
        <td style="text-align:right;font-family:sans-serif;font-size:10px;color:#aaa;letter-spacing:0.08em;text-transform:uppercase">Zamówienie online</td>
      </tr></table>
    </div>
    <div style="border-bottom:1px solid #d4c5ae;margin-bottom:24px"></div>
    <h1 style="font-family:'Georgia',serif;font-size:22px;font-weight:600;color:#1a1a1a;margin:0 0 6px;line-height:1.3">${title}</h1>
    <p style="font-family:'Georgia',serif;font-size:14px;color:#555;margin:0 0 20px;line-height:1.6">${intro}</p>
    <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e8e3db">${rows}</table>
    ${footNote ? `<p style="font-family:'Georgia',serif;font-size:12px;color:#999;margin:18px 0 0;line-height:1.6">${footNote}</p>` : ""}
    <div style="border-top:1px solid #e8e3db;margin-top:26px;padding-top:12px;text-align:center">
      <p style="font-family:sans-serif;font-size:10px;color:#aaa;letter-spacing:0.06em;text-transform:uppercase">
        Mekra.pl · Producent frontów ramiakowych · tel. 792 456 094 · kontakt@mekra.pl
      </p>
    </div>
  </div>
</body></html>`;
}

function orderDetailRows(order) {
  const d = order.detail || {};
  const c = order.contact || {};
  const rows = [];
  if (order.type === "samples") {
    rows.push(orderRow("Rodzaj", "Zamówienie próbek"));
    rows.push(orderRow("Zestaw", escapeHtml(d.sampleSet?.name || "—")));
  } else {
    const p = d.pricing || {};
    // nowy kształt: d.positions[]; stare zamówienia (sprzed 2026-08-12) miały d.sheet wprost
    const positions = (d.positions || []).length ? d.positions
      : (d.sheet ? [{ producer: d.producer, sheet: d.sheet, ramka: d.ramka, m2: d.m2, formatki: d.formatki || [] }] : []);
    rows.push(orderRow("Rodzaj", `Fronty ramiakowe na wymiar${positions.length > 1 ? ` — ${positions.length} dekory` : ""}`));
    positions.forEach((pt, i) => {
      const line = (p.posLines || [])[i] || { sheets: p.sheets, sheetPrice: p.sheetPrice, sheetsCost: p.sheetsCost };
      const suffix = positions.length > 1 ? ` — pozycja ${i + 1}` : "";
      rows.push(orderRow(`<strong>Dekor${suffix}</strong>`, escapeHtml(`${pt.sheet?.name || ""} · ${pt.sheet?.code || ""} (${pt.producer?.name || ""}, ${pt.sheet?.finish || ""})`)));
      rows.push(orderRow("Grubość ramki", escapeHtml(pt.ramka || "—")));
      rows.push(orderRow("Powierzchnia", `${m2pl(pt.m2)} m²`));
      rows.push(orderRow("Arkusze", `${line.sheets} × ${zl(line.sheetPrice)} = ${zl(line.sheetsCost)}`));
      rows.push(orderRow("Formatki", (pt.formatki || []).length
        ? pt.formatki.map((f) => `${f.w} × ${f.h} mm — ${f.qty} szt.`).join("<br>")
        : "do uzupełnienia po zamówieniu"));
    });
    rows.push(orderRow("Wykonanie", `${m2pl(d.m2)} m² × ${zl(ORDER_PRICING.m2Fee)} = ${zl(p.laborCost)}`));
    for (const a of p.addonLines || []) rows.push(orderRow(escapeHtml(a.name), `${a.qty} szt. = ${zl(a.value)}`));
    if (p.grainCost > 0) rows.push(orderRow("Słój przechodzący (+20%)", zl(p.grainCost)));
    if (p.belowMin > 0) rows.push(orderRow(`Dopłata poniżej ${ORDER_PRICING.minM2} m² (+30%)`, zl(p.belowMin)));
    rows.push(orderRow("<strong>Razem netto</strong>", `<strong style="color:#866751">${zl(order.amountNet)}</strong>`));
    rows.push(orderRow("Razem brutto (VAT 23%)", zl(order.amountGross)));
  }
  rows.push(orderRow("Zamawiający", `${escapeHtml(c.name)}<br>${escapeHtml(c.email)} · ${escapeHtml(c.phone)}`));
  rows.push(orderRow("Adres dostawy", `${escapeHtml(c.street)}, ${escapeHtml(c.zip)} ${escapeHtml(c.city)}`));
  if (c.nip) rows.push(orderRow("NIP", escapeHtml(c.nip)));
  if (c.notes) rows.push(orderRow("Uwagi", escapeHtml(c.notes).replace(/\n/g, "<br>")));
  rows.push(orderRow("Nr zamówienia", escapeHtml(order.orderNo || order.id)));
  return rows.join("");
}

// Wysyłka maila zamówieniowego: na kontakt@mekra.pl przez SMTP cyber-folks
// (RBL hostkarma — patrz komentarz wyżej), do klienta przez SES.
async function sendOrderEmail({ to, subject, replyTo, htmlBody, viaSmtp = false }) {
  const raw = buildRawEmail({ subject, replyTo, htmlBody, to });
  if (viaSmtp) {
    try {
      return await sendViaSmtp(raw, to);
    } catch (e) {
      console.error("Order SMTP fail, fallback SES:", to, e);
    }
  }
  return ses.send(new SendRawEmailCommand({
    Source: `${FROM_NAME} <${FROM_EMAIL}>`,
    Destinations: [to],
    RawMessage: { Data: Buffer.from(raw, "utf8") },
    ConfigurationSetName: CONFIG_SET,
  }));
}

// Maile po zamówieniu (do Karola i do klienta) — allSettled: awaria jednego
// kanału nie może zabrać drugiego. Zwraca true, gdy wyszedł choć jeden.
async function sendOrderEmails(order, { paid }) {
  const c = order.contact || {};
  const isSamples = order.type === "samples";
  const rows = orderDetailRows(order);

  const adminHtml = orderEmailHtml({
    title: isSamples ? "Nowe zamówienie próbek" : (paid ? `Opłacone zamówienie ${order.orderNo}` : `Zamówienie ${order.orderNo}`),
    intro: isSamples
      ? "Klient zamówił próbki przez kreator na mekra.pl."
      : (paid ? `Płatność Stripe zaksięgowana: <strong>${zl(order.amountGross)}</strong> brutto.` : "Nowe zamówienie z kreatora na mekra.pl."),
    rows,
    footNote: order.stripeSessionId ? `Stripe session: ${escapeHtml(order.stripeSessionId)}` : "",
  });

  const clientHtml = orderEmailHtml({
    title: isSamples ? "Przyjęliśmy Twoje zamówienie próbek" : "Dziękujemy za zamówienie!",
    intro: isSamples
      ? "Dziękujemy! Odezwiemy się mailowo lub telefonicznie, aby potwierdzić koszt i termin wysyłki próbek."
      : `Płatność została przyjęta. Poniżej podsumowanie Twojego zamówienia — skontaktujemy się, aby potwierdzić specyfikację. Standardowy czas realizacji to 8–10 tygodni od potwierdzenia.`,
    rows,
    footNote: "Masz pytania? Odpisz na tego maila albo zadzwoń: 792 456 094.",
  });

  const subjectAdmin = isSamples
    ? `Zamówienie próbek: ${c.name || ""}`
    : `${paid ? "✅ Opłacone" : "Nowe"} zamówienie ${order.orderNo}: ${zl(order.amountGross)} — ${c.name || ""}`;
  const subjectClient = isSamples
    ? "Przyjęliśmy Twoje zamówienie próbek — Mekra.pl"
    : `Potwierdzenie zamówienia ${order.orderNo} — Mekra.pl`;

  const results = await Promise.allSettled([
    sendOrderEmail({ to: TO_EMAIL, subject: subjectAdmin, replyTo: c.email || TO_EMAIL, htmlBody: adminHtml, viaSmtp: true }),
    sendOrderEmail({ to: c.email, subject: subjectClient, replyTo: TO_EMAIL, htmlBody: clientHtml }),
  ]);
  results.forEach((r, i) => {
    if (r.status === "rejected") console.error(`Order mail ${i === 0 ? "admin" : "client"} FAIL:`, r.reason);
  });
  return results.some((r) => r.status === "fulfilled");
}

function newOrderIds() {
  const id = randomUUID();
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  const orderNo = `MEK-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${id.slice(0, 4).toUpperCase()}`;
  return { id, orderNo };
}

// POST /order/session — walidacja, wycena serwerowa, zapis do panelu, sesja Stripe.
async function orderSession(body, origin, headers) {
  const cfg = await getStripeCfg();
  if (!validContact(body.contact)) return { statusCode: 400, headers, body: JSON.stringify({ error: "Niepełne dane zamawiającego" }) };
  const positions = normPositions(body.positions);
  if (!positions.length) return { statusCode: 400, headers, body: JSON.stringify({ error: "Brak kompletnych pozycji zamówienia" }) };
  const pricing = computeOrderPricing(positions, body.addons, !!body.grain);
  if (!pricing) return { statusCode: 400, headers, body: JSON.stringify({ error: "Nieprawidłowe dane wyceny" }) };

  const { id, orderNo } = newOrderIds();
  const detail = {
    positions, m2: pricing.m2, addons: body.addons || {}, grain: !!body.grain, pricing,
  };
  await panelOrder(cfg, "POST", {
    id, orderNo, type: "custom", status: "oczekuje_platnosci",
    amountNet: pricing.net, amountGross: pricing.gross,
    detail, contact: body.contact,
  });

  const site = ALLOWED_ORIGINS.includes(origin) ? origin : "https://www.mekra.pl";
  const session = await cfg.client.checkout.sessions.create({
    mode: "payment",
    customer_email: String(body.contact.email),
    locale: "pl",
    line_items: [{
      quantity: 1,
      price_data: {
        currency: "pln",
        unit_amount: pricing.grossGr,
        product_data: {
          name: positions.length > 1
            ? `Fronty ramiakowe na wymiar — ${positions.length} dekory`
            : `Fronty ramiakowe na wymiar — ${positions[0].sheet.name} (${positions[0].producer.name})`,
          description: (positions.map((p) => `${p.sheet.name} ${p.sheet.code} — ${m2pl(p.m2)} m², ramka ${p.ramka}`).join(" | ")
            + ` · zamówienie ${orderNo} (cena brutto z VAT 23%)`).slice(0, 480),
        },
      },
    }],
    success_url: `${site}/zamowienie/dziekujemy/?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${site}/zamowienie/?payment=cancelled`,
    metadata: { orderId: id, orderNo },
    payment_intent_data: { metadata: { orderId: id, orderNo } },
  });

  await panelOrder(cfg, "PUT", { id, status: "oczekuje_platnosci", stripeSessionId: session.id });
  console.log("Order session created:", orderNo, session.id, "gross:", pricing.gross);
  return { statusCode: 200, headers, body: JSON.stringify({ url: session.url, orderNo }) };
}

// POST /order/submit — próbki (bez płatności): zapis do panelu + maile od razu.
async function orderSubmit(body, headers) {
  const cfg = await getStripeCfg();
  if (body.type !== "samples") return { statusCode: 400, headers, body: JSON.stringify({ error: "Ta ścieżka obsługuje tylko próbki" }) };
  if (!validContact(body.contact)) return { statusCode: 400, headers, body: JSON.stringify({ error: "Niepełne dane zamawiającego" }) };
  if (!body.sampleSet?.id) return { statusCode: 400, headers, body: JSON.stringify({ error: "Brak wybranego zestawu próbek" }) };

  const { id, orderNo } = newOrderIds();
  const order = {
    id, orderNo, type: "samples", status: "nowe",
    amountNet: null, amountGross: null,
    detail: { sampleSet: { id: String(body.sampleSet.id), name: String(body.sampleSet.name || "") } },
    contact: body.contact,
  };
  await panelOrder(cfg, "POST", order);
  const mailed = await sendOrderEmails(order, { paid: false });
  if (!mailed) console.error("Zamówienie próbek zapisane, ale żaden mail nie wyszedł:", orderNo);
  console.log("Samples order:", orderNo, "mailed:", mailed);
  return { statusCode: 200, headers, body: JSON.stringify({ ok: true, orderNo }) };
}

// POST /order/webhook — Stripe. Weryfikacja podpisu na SUROWYM body; po
// checkout.session.completed: status w panelu + maile (idempotentnie).
async function orderWebhook(event) {
  const cfg = await getStripeCfg();
  const sig = event.headers?.["stripe-signature"] || "";
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body || "", "base64").toString("utf8")
    : (event.body || "");

  let stripeEvent;
  try {
    stripeEvent = cfg.client.webhooks.constructEvent(raw, sig, cfg.webhookSecret);
  } catch (err) {
    console.error("Webhook signature FAIL:", err.message);
    return { statusCode: 400, body: JSON.stringify({ error: "Bad signature" }) };
  }

  try {
    if (stripeEvent.type === "checkout.session.completed") {
      const session = stripeEvent.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId && session.payment_status === "paid") {
        const upd = await panelOrder(cfg, "PUT", {
          id: orderId, status: "oplacone",
          stripeSessionId: session.id,
          paymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : null,
          paidAt: new Date().toISOString(),
        });
        if (upd.previousStatus === "oplacone") {
          console.log("Webhook retry — maile już wysłane:", orderId);
        } else {
          const { order } = await panelOrder(cfg, "GET", null, `?id=${encodeURIComponent(orderId)}`);
          await sendOrderEmails(order, { paid: true });
          console.log("Order paid + mailed:", order.orderNo, session.id);
        }
      } else {
        console.warn("completed bez orderId/paid:", session.id, session.payment_status);
      }
    } else if (stripeEvent.type === "checkout.session.expired") {
      const session = stripeEvent.data.object;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        // nie nadpisujemy opłaconego zamówienia (teoretyczny wyścig przy retry)
        const { order } = await panelOrder(cfg, "GET", null, `?id=${encodeURIComponent(orderId)}`).catch(() => ({ order: null }));
        if (order && order.status === "oczekuje_platnosci") {
          await panelOrder(cfg, "PUT", { id: orderId, status: "anulowane" });
          console.log("Order expired:", orderId);
        }
      }
    }
  } catch (err) {
    // 500 → Stripe ponowi webhook (do 3 dni) — lepsze niż zgubienie zdarzenia.
    console.error("Webhook processing error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: "processing" }) };
  }
  return { statusCode: 200, body: JSON.stringify({ received: true }) };
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

  // Routing po ścieżce: /contact (formularz kontaktowy — bez zmian),
  // /order/* — kreator zamówień ze Stripe.
  const path = event.rawPath || event.requestContext?.http?.path || "";
  try {
    if (path.endsWith("/order/webhook")) return await orderWebhook(event); // bez CORS — woła Stripe, nie przeglądarka
    if (path.endsWith("/order/session")) return await orderSession(JSON.parse(event.body || "{}"), origin, headers);
    if (path.endsWith("/order/submit")) return await orderSubmit(JSON.parse(event.body || "{}"), headers);
  } catch (error) {
    console.error("Order route error:", path, error);
    return { statusCode: 500, headers, body: JSON.stringify({ error: "Błąd obsługi zamówienia" }) };
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
