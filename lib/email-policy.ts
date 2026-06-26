/**
 * Email hygiene for signup: a pragmatic format check plus a disposable /
 * temporary-inbox blocklist. Two cheap, dependency-free layers that keep junk
 * and throwaway-inbox accounts out without calling an external service.
 *
 * The blocklist is a curated in-repo set — to extend it, just add a domain.
 * It catches the overwhelming majority of casual temp-mail use. For exhaustive
 * coverage you could later layer in a maintained upstream list (e.g. the
 * `disposable-email-domains` package or a fetched feed), but that's a much
 * larger list to vet and ship — this curated set is the high-value 80/20.
 */

// Pragmatic, not full RFC 5322 — requires local@domain.tld with no spaces and
// a real TLD. Deliberately simple: the goal is to reject obvious garbage, not
// to perfectly model the spec (which would reject valid addresses anyway).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function isValidEmailFormat(email: string): boolean {
  const value = email.trim();
  if (value.length === 0 || value.length > 254) return false; // RFC max length
  return EMAIL_RE.test(value);
}

/** The domain part of an email, lowercased. "" if it has no "@". */
function emailDomain(email: string): string {
  const at = email.lastIndexOf("@");
  return at === -1 ? "" : email.slice(at + 1).trim().toLowerCase();
}

// Known disposable / temporary-inbox providers. Lowercase, no leading dot.
// Subdomains are handled by isDisposableEmail (so "x.mailinator.com" matches).
const DISPOSABLE_DOMAINS = new Set<string>([
  // Mailinator + friends
  "mailinator.com",
  "mailinator.net",
  "mailinator2.com",
  "reallymymail.com",
  // Guerrilla Mail
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.info",
  "guerrillamail.biz",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "spam.me",
  "spam4.me",
  // 10/20 minute mail
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "10minutemail.co.uk",
  // Temp-Mail family
  "temp-mail.org",
  "tempmail.com",
  "tempmail.net",
  "tempmailo.com",
  "tempmail.plus",
  "tempr.email",
  "tmail.io",
  "tmpmail.org",
  "tmpmail.net",
  "tmpeml.com",
  "moakt.com",
  "mohmal.com",
  // YOPmail
  "yopmail.com",
  "yopmail.net",
  "yopmail.fr",
  // Other common throwaways
  "throwawaymail.com",
  "throwam.com",
  "getnada.com",
  "nada.email",
  "maildrop.cc",
  "mailnesia.com",
  "mintemail.com",
  "trashmail.com",
  "trashmail.de",
  "trbvm.com",
  "dispostable.com",
  "fakeinbox.com",
  "spamgourmet.com",
  "emailondeck.com",
  "mailcatch.com",
  "discard.email",
  "33mail.com",
  "anonbox.net",
  "inboxkitten.com",
  "mailpoof.com",
  "burnermail.io",
  "1secmail.com",
  "1secmail.org",
  "1secmail.net",
  "cock.li",
  "0815.ru",
]);

/**
 * True if the email belongs to a known disposable / temporary-inbox provider.
 * Matches the exact domain AND any subdomain (e.g. "foo.mailinator.com"),
 * since several services hand out throwaway subdomains.
 */
export function isDisposableEmail(email: string): boolean {
  const domain = emailDomain(email);
  if (!domain) return false;
  const parts = domain.split(".");
  // Walk the domain and each parent suffix: "x.mailinator.com" -> check
  // "x.mailinator.com", then "mailinator.com". Stop before the bare TLD.
  for (let i = 0; i < parts.length - 1; i++) {
    if (DISPOSABLE_DOMAINS.has(parts.slice(i).join("."))) return true;
  }
  return false;
}
