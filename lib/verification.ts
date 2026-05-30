import { createHash, randomBytes } from "node:crypto";
import { and, eq, isNull } from "drizzle-orm";

import { getDb } from "@/lib/db";
import { emailVerificationTokens } from "@/lib/db/schema";
import { sendEmail } from "@/lib/email";
import { siteUrl } from "@/lib/site";

const TOKEN_TTL_HOURS = 48;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Generate a fresh verification token for the user, invalidate any older
 * unused tokens (so an attacker who somehow got hold of the previous link
 * can't reuse it), and email the link out. Returns silently if there's no
 * email transport configured — useful in dev / preview.
 */
export async function issueVerificationEmail({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): Promise<void> {
  const db = getDb();
  const token = randomBytes(32).toString("base64url");
  const verifyUrl = `${siteUrl}/verify-email?token=${encodeURIComponent(token)}`;

  await db
    .update(emailVerificationTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(emailVerificationTokens.userId, userId),
        isNull(emailVerificationTokens.usedAt),
      ),
    );

  await db.insert(emailVerificationTokens).values({
    userId,
    tokenHash: tokenHash(token),
    expiresAt: new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000),
  });

  try {
    const result = await sendEmail({
      to: email,
      subject: "Verify your QraftPaper email",
      idempotencyKey: `verify-${userId}-${tokenHash(token).slice(0, 16)}`,
      text: `Click the link to confirm your QraftPaper email. It expires in ${TOKEN_TTL_HOURS} hours.\n\n${verifyUrl}\n\nIf you didn't sign up, ignore this email.`,
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1a2332">
          <h1 style="font-size:20px">Verify your QraftPaper email</h1>
          <p>Click below to confirm this is your email. The link expires in ${TOKEN_TTL_HOURS} hours.</p>
          <p><a href="${verifyUrl}" style="color:#1f7d7d">Verify email</a></p>
          <p style="font-size:13px;color:#566779">If you didn't sign up for QraftPaper, you can ignore this email.</p>
        </div>
      `,
    });

    if (result.skipped) {
      console.warn(
        "[email-verification] email transport disabled; verification email not sent",
      );
    }
  } catch (error) {
    console.error("[email-verification] email send failed", error);
  }
}

export function hashVerificationToken(token: string) {
  return tokenHash(token);
}

