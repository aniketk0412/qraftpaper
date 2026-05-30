// Single source of truth for plans: pricing-page display AND enforced limits
// both read from here, so they can never drift apart.
//
// Tune these as you learn your real cost per generation (the aiUsageEvents
// table tracks estimatedCostCents per AI call). Generation runs on Claude
// Sonnet (~$0.10–0.20 per paper/quiz); the monthly allowance is your cost cap.

export type PlanId = "unpaid" | "educator" | "department" | "institution";

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
  // Plan ids stay "educator" / "department" so existing DB rows, LemonSqueezy
  // variant mappings, webhooks and audit logs don't have to migrate. Only the
  // display strings change to match the actual buyer: a student.
  educator: {
    id: "educator",
    name: "Solo",
    price: "$7",
    priceInr: "₹579",
    period: "/ month",
    tagline: "Everything you need to actually prep for one exam season.",
    cta: "Start practising",
    featured: true,
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
  department: {
    id: "department",
    name: "Crew",
    price: "$24",
    priceInr: "₹1,999",
    period: "/ month",
    tagline: "For a study group splitting one workspace across friends.",
    cta: "Get started",
    featured: true,
    badge: "Best value",
    generationsPerMonth: 90,
    maxSubjects: 25,
    papersPerSubject: 12,
    quizzesPerSubject: 20,
    features: [
      "90 papers & quizzes / month",
      "Up to 25 subjects across the group",
      "Reusable blueprints for repeat exam patterns",
      "Repeat-reduction so no two papers feel identical",
      "Difficulty & Bloom's balancing",
      "Faster support",
    ],
  },
  institution: {
    id: "institution",
    name: "Institution",
    price: "Custom",
    period: "",
    tagline: "For universities running examinations at scale.",
    cta: "Talk to sales",
    featured: false,
    badge: "Enterprise",
    generationsPerMonth: null,
    maxSubjects: null,
    papersPerSubject: null,
    quizzesPerSubject: null,
    features: [
      "Custom monthly allowance",
      "Unlimited subjects & seats",
      "Workspace roles by agreement",
      "Usage and billing review",
      "Dedicated success manager",
      "Custom integrations & SLA",
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
 * Single-tier today: just Solo. The Crew/department tier is kept in PLANS
 * for legacy DB rows + future workspace-sharing work, but it is NOT publicly
 * sold — there is no shared-workspace feature yet, so selling it would be
 * vapourware. Institution stays internal-only for the same reason.
 */
export const PRICING_TIERS: Plan[] = [PLANS.educator];
