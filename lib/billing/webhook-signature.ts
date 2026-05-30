import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify a Lemon Squeezy webhook's `X-Signature` header against the raw
 * request body using the shared webhook secret.
 *
 * This is the single gate that stops a forged webhook from granting a paid
 * plan for free, so it is deliberately defensive:
 *
 *   - Constant-time comparison via timingSafeEqual, so an attacker can't
 *     brute-force the signature byte-by-byte off timing.
 *   - Length check BEFORE timingSafeEqual — that function throws if the two
 *     buffers differ in length, which would surface as a 500 instead of a
 *     clean "invalid signature". A wrong-length signature must just return
 *     false.
 *   - Empty/garbage signatures: an empty string decodes to a zero-length
 *     buffer that fails the length check; non-hex characters decode to a
 *     shorter buffer that also fails the length check. Neither throws.
 *
 * Lives in its own module (rather than inline in the route) purely so it can
 * be unit-tested — the route imports it unchanged.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string,
): boolean {
  if (!signature) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");

  const expectedBuffer = Buffer.from(expected, "hex");
  const actualBuffer = Buffer.from(signature, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
