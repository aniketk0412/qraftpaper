import disposableList from "disposable-email-domains";

/**
 * Email hygiene for signup: a pragmatic format check plus a disposable /
 * temporary-inbox blocklist. Two cheap layers that keep junk and throwaway
 * accounts out without calling an external service at request time.
 *
 * The blocklist is the maintained `disposable-email-domains` feed (100k+
 * domains) merged with a small curated supplement (add anything you spot
 * abusing signup before it lands upstream). To refresh the upstream list,
 * `npm update disposable-email-domains`.
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

// Hand-curated supplement to the upstream feed — guarantees coverage of the
// best-known providers and is where to add a domain you catch abusing signup
// before it appears upstream. Lowercase, no leading dot.
const CURATED_EXTRAS = [
  "mailinator.com",
  "guerrillamail.com",
  "sharklasers.com",
  "10minutemail.com",
  "temp-mail.org",
  "tempmail.com",
  "yopmail.com",
  "getnada.com",
  "maildrop.cc",
  "throwawaymail.com",
  "trashmail.com",
  "dispostable.com",
  "fakeinbox.com",
  "moakt.com",
  "1secmail.com",
  "burnermail.io",
];

// Authoritative blocklist: the maintained upstream feed + curated extras.
// Built once at module load; lookups stay O(domain labels) via the suffix walk
// in isDisposableEmail, not O(set size).
const DISPOSABLE_DOMAINS = new Set<string>([
  ...disposableList,
  ...CURATED_EXTRAS,
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
