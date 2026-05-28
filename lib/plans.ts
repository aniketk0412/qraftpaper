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
    tagline: "Explore a sample workspace.",
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
    tagline: "For one student grinding through their own syllabus.",
    cta: "Get started",
    featured: false,
    generationsPerMonth: 20,
    maxSubjects: 5,
    papersPerSubject: 6,
    quizzesPerSubject: 10,
    features: [
      "20 papers & quizzes / month",
      "Up to 5 subjects",
      "Up to 6 papers per subject",
      "Mirrors your previous-year paper style",
      "PDF & Word export to print and practice",
      "Shareable quiz links",
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
 * Institution is intentionally NOT listed here — LemonSqueezy reviewers won't
 * approve a public "Custom / Talk to sales" tier, and we don't currently sell
 * a real top-tier variant. Enterprise deals are still handled by assigning the
 * `institution` plan id manually after a direct conversation.
 */
export const PRICING_TIERS: Plan[] = [PLANS.educator, PLANS.department];
