// heartbeat/index.mjs
// Lambda: mekra-heartbeat
// Triggered by EventBridge every 2 days. Sends a test email through the
// SAME path the real contact form uses (SES us-east-1, formularz@mekra.pl,
// S3 presigned URL from mekra-attachments). If anything throws, posts a
// failure alert to Slack via webhook (URL injected via SLACK_WEBHOOK_URL env).
//
// On success: just logs MessageId, returns 200. No Slack noise.
// On failure: POSTs to Slack with stage + error, then re-throws so the
// invocation shows as Errored in CloudWatch.

import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = process.env.AWS_REGION || "eu-central-1";
const SES_REGION = "us-east-1";

const BUCKET = process.env.BUCKET_NAME || "mekra-attachments";
const TEST_KEY = process.env.TEST_KEY || "heartbeat/test-attachment.txt";
const TO_EMAIL = process.env.TO_EMAIL || "kontakt@mekra.pl";
const FROM_EMAIL = process.env.FROM_EMAIL || "formularz@mekra.pl";
const FROM_NAME = "Mekra Heartbeat";
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

const ses = new SESClient({ region: SES_REGION });
const s3 = new S3Client({ region: REGION });

async function notifySlack(stage, err) {
  if (!SLACK_WEBHOOK_URL) {
    console.error("SLACK_WEBHOOK_URL not set — cannot alert");
    return;
  }
  const payload = {
    text: `:rotating_light: *mekra contact-form heartbeat FAILED*`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:rotating_light: *mekra contact-form heartbeat FAILED*\nStage: \`${stage}\`\nError: \`${(err && err.name) || "Error"}: ${(err && err.message) || String(err)}\``,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: `Function: \`mekra-heartbeat\` · Region: \`${REGION}\` · SES: \`${SES_REGION}\` · ${new Date().toISOString()}`,
          },
          {
            type: "mrkdwn",
            text: "Real contact form may be broken. Test manually at https://www.mekra.pl/#kontakt and check CloudWatch logs for `mekra-heartbeat`.",
          },
        ],
      },
    ],
  };
  try {
    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("Slack webhook returned", res.status, await res.text());
    }
  } catch (slackErr) {
    console.error("Slack POST failed:", slackErr.message);
  }
}

export const handler = async () => {
  const startedAt = new Date();
  let stage = "init";

  try {
    // 1) Generate presigned URL — exercises S3 GetObject + signer
    stage = "presign";
    const presignCmd = new GetObjectCommand({ Bucket: BUCKET, Key: TEST_KEY });
    const downloadUrl = await getSignedUrl(s3, presignCmd, { expiresIn: 24 * 60 * 60 });

    // 2) Build HTML body — same visual template as real contact-form for parity
    stage = "build-email";
    const isoTs = startedAt.toISOString();
    const htmlBody = `
<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:'Georgia','Times New Roman',serif;background:#fafaf8">
  <div style="max-width:620px;margin:0 auto;padding:32px 16px">
    <div style="border-top:3px solid #866751;padding-top:16px;margin-bottom:8px">
      <table style="width:100%"><tr>
        <td style="font-family:'Georgia',serif;font-size:20px;font-weight:600;color:#1a1a1a">
          <span style="display:inline-block;width:28px;height:28px;background:#866751;color:#fff;text-align:center;line-height:28px;border-radius:6px;font-size:16px;margin-right:8px;vertical-align:middle">M</span>
          Mekra · Heartbeat
        </td>
        <td style="text-align:right;font-family:sans-serif;font-size:10px;color:#aaa;letter-spacing:0.08em;text-transform:uppercase">Synthetic monitor</td>
      </tr></table>
    </div>
    <div style="border-bottom:1px solid #d4c5ae;margin-bottom:24px"></div>

    <h1 style="font-family:'Georgia',serif;font-size:20px;color:#1a1a1a;margin:0 0 6px">Pipeline OK — można zignorować</h1>
    <p style="font-family:sans-serif;font-size:11px;color:#aaa;margin:0 0 24px">${isoTs}</p>

    <table style="width:100%;border-collapse:collapse;background:#ffffff;border:1px solid #e8e3db">
      <tr>
        <td style="padding:12px 20px;font-family:'Georgia',serif;font-weight:600;color:#1a1a1a;width:140px;border-bottom:1px solid #e8e3db">Co to jest:</td>
        <td style="padding:12px 20px;font-family:'Georgia',serif;color:#555;border-bottom:1px solid #e8e3db">
          Automatyczny test ścieżki formularza kontaktowego. Lambda <code>mekra-heartbeat</code> wystartowała przez EventBridge i poprawnie:
          <ul style="margin:8px 0 0;padding-left:20px">
            <li>wygenerowała presigned URL do S3 (<code>${BUCKET}/${TEST_KEY}</code>)</li>
            <li>wysłała ten e-mail przez SES (<code>${SES_REGION}</code>)</li>
            <li>z adresu <code>${FROM_EMAIL}</code></li>
          </ul>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 20px;font-family:'Georgia',serif;font-weight:600;color:#1a1a1a;border-bottom:1px solid #e8e3db">Testowy załącznik:</td>
        <td style="padding:12px 20px;font-family:'Georgia',serif;color:#555;border-bottom:1px solid #e8e3db">
          <a href="${downloadUrl}" style="color:#866751;text-decoration:underline">test-attachment.txt</a>
          <p style="font-size:11px;color:#aaa;margin-top:6px">Link ważny 24h. Kliknij raz na początku, żeby sprawdzić że presigned URL też działa.</p>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 20px;font-family:'Georgia',serif;font-weight:600;color:#1a1a1a">Akcja:</td>
        <td style="padding:12px 20px;font-family:'Georgia',serif;color:#555">
          Skonfiguruj filtr w Gmail: subject zawiera <code>[HEARTBEAT]</code> → <em>Skip Inbox, Apply label monitoring/mekra</em>.
          Jak przestaną przychodzić — albo dostaniesz alert na Slacka, albo cron padł (sprawdź EventBridge).
        </td>
      </tr>
    </table>

    <div style="border-top:1px solid #e8e3db;padding-top:12px;margin-top:24px;text-align:center">
      <p style="font-family:sans-serif;font-size:10px;color:#aaa;letter-spacing:0.06em;text-transform:uppercase">
        Synthetic heartbeat · Mekra contact form pipeline monitor
      </p>
    </div>
  </div>
</body></html>`;

    // 3) Send via SES — same call site as real form
    stage = "ses-send";
    const sesCmd = new SendEmailCommand({
      Source: `${FROM_NAME} <${FROM_EMAIL}>`,
      Destination: { ToAddresses: [TO_EMAIL] },
      Message: {
        Subject: {
          Data: `[HEARTBEAT] mekra contact-form OK — ${isoTs}`,
          Charset: "UTF-8",
        },
        Body: { Html: { Data: htmlBody, Charset: "UTF-8" } },
      },
    });
    const sesResult = await ses.send(sesCmd);

    console.log(JSON.stringify({
      ok: true,
      stage: "done",
      messageId: sesResult.MessageId,
      to: TO_EMAIL,
      from: FROM_EMAIL,
      bucket: BUCKET,
      key: TEST_KEY,
      durationMs: Date.now() - startedAt.getTime(),
    }));

    return { ok: true, messageId: sesResult.MessageId };
  } catch (err) {
    console.error(JSON.stringify({
      ok: false,
      stage,
      errorName: err && err.name,
      errorMessage: err && err.message,
    }));
    await notifySlack(stage, err);
    throw err; // surface as Lambda error → CloudWatch metric
  }
};
