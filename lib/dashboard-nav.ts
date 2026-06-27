import {
  CreditCard,
  DraftingCompass,
  FileText,
  LayoutDashboard,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

// "The Drafting Table" consolidates the old Subjects + Blueprints tabs into one
// workspace: subjects are the index, blueprints expand contextually within
// them. It keeps the canonical /dashboard/subjects route (most inbound links),
// and /dashboard/blueprints permanently redirects here.
export const workspaceNav: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  {
    label: "The Drafting Table",
    icon: DraftingCompass,
    href: "/dashboard/subjects",
  },
  { label: "Question Papers", icon: FileText, href: "/dashboard/papers" },
];

export const accountNav: NavItem[] = [
  { label: "Billing", icon: CreditCard, href: "/billing" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export const allNav: NavItem[] = [...workspaceNav, ...accountNav];
