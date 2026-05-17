import {
  BookOpen,
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
  { label: "Subjects", icon: BookOpen, href: "#" },
  { label: "Question Papers", icon: FileText, href: "/papers/demo" },
  { label: "Blueprints", icon: Ruler, href: "#" },
];

export const accountNav: NavItem[] = [
  { label: "Team", icon: Users, href: "#" },
  { label: "Settings", icon: Settings, href: "#" },
];

export const allNav: NavItem[] = [...workspaceNav, ...accountNav];
