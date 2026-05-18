import {
  BookOpen,
  CreditCard,
  FileText,
  LayoutDashboard,
  Ruler,
  Settings,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  icon: LucideIcon;
  href: string;
}

export const workspaceNav: NavItem[] = [
  { label: "Overview", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Subjects", icon: BookOpen, href: "/dashboard/subjects" },
  { label: "Question Papers", icon: FileText, href: "/dashboard/papers" },
  { label: "Blueprints", icon: Ruler, href: "/dashboard/blueprints" },
];

export const accountNav: NavItem[] = [
  { label: "Team", icon: Users, href: "/dashboard/team" },
  { label: "Billing", icon: CreditCard, href: "/billing" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export const allNav: NavItem[] = [...workspaceNav, ...accountNav];
