// Single source of truth for plans: pricing-page display AND enforced limits
// both read from here, so they can never drift apart.
//
// Generation runs on Claude Haiku 4.5 via OpenRouter (input $1 / output $5 per
// 1M tokens). Measured cost per generation is ~1.5–3¢ (paper max_tokens 5000,
// quiz 4500, ~3.5k prompt tokens dominated by the cached subject profile). A
// full trial — 3 papers + one syllabus extraction — costs ~6–12¢ worst case.
// The aiUsageEvents table tracks estimatedCostCents per call; the per-plan
// allowance below is your hard cost cap. Tune as your real numbers come in.

export type PlanId =
  | "unpaid"
  | "trial"
  | "educator";

export interface PlanLimits {
  /** Paper + quiz generations allowed per calendar month. null = unlimited. */
  generationsPerMonth: number | null;
  /** Max subjects on the account. null = unlimited. */
  maxSubjects: number | null;
  /** Max papers kept per subject. null = unlimited. */
  papersPerSubject: number | null;
  /** Max quizzes kept per subject. null = unlimited. */
  quizzesPerSubject: number | null;
}

export interface Plan extends PlanLimits {
  id: PlanId;
  name: string;
  price: string;
  /** Display-only INR equivalent for Indian visitors. LemonSqueezy still
   *  charges in USD; this is a perception fix, not a billing change. */
  priceInr?: string;
  period: string;
  tagline: string;
  cta: string;
  featured: boolean;
  badge?: string;
  features: string[];
}

export const PLANS: Record<PlanId, Plan> = {
  unpaid: {
    id: "unpaid",
    name: "Free preview",
    price: "$0",
    period: "",
    tagline: "Browse a sample paper and quiz — no generation until you subscribe.",
    cta: "Sign up",
    featured: false,
    generationsPerMonth: 0,
    maxSubjects: 0,
    papersPerSubject: 0,
    quizzesPerSubject: 0,
    features: ["Browse a sample paper", "No generation until you subscribe"],
  },
  // One-time $1 "3-Day Pass" — a paid tripwire, not a free tier. It exists to
  // let a student feel the "this matches my exam" moment before committing to
  // Solo. The 3-generation cap is the cost ceiling (~6–12¢ COGS worst case, so
  // ~8× margin even with zero conversion). The 3-DAY WINDOW is enforced at the
  // subscription/account layer (expiry), NOT here — `generationsPerMonth` is
  // only the generation cap; see `lib/billing/trial.ts` for expiry +
  // one-time-eligibility enforcement.
  trial: {
    id: "trial",
    name: "3-Day Pass",
    price: "$1",
    priceInr: "₹99",
    period: "one-time",
    tagline: "Try it on your real exam before you commit. Three papers, three days.",
    cta: "Start the $1 pass",
    featured: false,
    badge: "Try first",
    generationsPerMonth: 3,
    maxSubjects: 1,
    papersPerSubject: 3,
    quizzesPerSubject: 3,
    features: [
      "3 generations (papers or quizzes)",
      "Matched to your syllabus + previous-year paper",
      "PDF & Word export",
      "Full access for 3 days",
      "Upgrade to Solo anytime — no second charge",
    ],
  },
  // Plan id stays "educator" so existing DB rows, LemonSqueezy variant mappings,
  // webhooks and audit logs don't have to migrate. Only the display strings
  // change to match the actual buyer: a student.
  educator: {
    id: "educator",
    name: "Solo",
    price: "$7",
    priceInr: "₹579",
    period: "/ month",
    tagline: "Everything you need to actually prep for one exam season.",
    cta: "Start practising",
    featured: true,
    badge: "Most popular",
    generationsPerMonth: 20,
    maxSubjects: 5,
    papersPerSubject: 6,
    quizzesPerSubject: 10,
    features: [
      "20 mock papers + quizzes a month",
      "Up to 5 subjects in your study set",
      "Mirrors your previous-year paper style",
      "Timed MCQ quizzes with instant scoring",
      "Daily streak + per-topic mastery tracking",
      "PDF & Word export — print and solve by hand",
      "Shareable quiz links for friends",
      "Cancel anytime from your dashboard",
    ],
  },
};

/** Limits for a plan id, defaulting to Educator if the value is unknown. */
export function planLimits(planId: string): PlanLimits {
  const plan = PLANS[planId as PlanId] ?? PLANS.educator;
  return {
    generationsPerMonth: plan.generationsPerMonth,
    maxSubjects: plan.maxSubjects,
    papersPerSubject: plan.papersPerSubject,
    quizzesPerSubject: plan.quizzesPerSubject,
  };
}

/** Tiers shown on the public pricing page, in display order.
 *
 * The 3-Day Pass is the paid try-before-subscribe entry point; Solo is the
 * primary recurring plan.
 */
export const PRICING_TIERS: Plan[] = [PLANS.trial, PLANS.educator];
