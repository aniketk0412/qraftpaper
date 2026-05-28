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
  educator: {
    id: "educator",
    name: "Educator",
    price: "$7",
    period: "/ month",
    tagline: "For individual faculty setting their own papers.",
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
      "PYQ pattern learning",
      "PDF & Word export",
      "Email support",
    ],
  },
  department: {
    id: "department",
    name: "Department",
    price: "$24",
    period: "/ month",
    tagline: "For a department standardising across faculty.",
    cta: "Get started",
    featured: true,
    badge: "Most adopted",
    generationsPerMonth: 90,
    maxSubjects: 25,
    papersPerSubject: 12,
    quizzesPerSubject: 20,
    features: [
      "90 papers & quizzes / month",
      "Up to 25 subjects",
      "Shared blueprint library",
      "Originality guard across papers",
      "Difficulty & Bloom's balancing",
      "Priority support",
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
