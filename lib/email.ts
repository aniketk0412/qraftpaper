interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
}

export async function sendEmail(input: SendEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.EMAIL_FROM ??
    process.env.RESEND_FROM_EMAIL ??
    "QraftPaper <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY is not configured; skipped send", {
      to: input.to,
      subject: input.subject,
    });
    return { skipped: true };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(input.idempotencyKey
        ? { "Idempotency-Key": input.idempotencyKey }
        : {}),
    },
    body: JSON.stringify({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`Email send failed: ${response.status} ${detail}`);
  }

  return { skipped: false };
}

