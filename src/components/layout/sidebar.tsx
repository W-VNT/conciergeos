"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Home,
  Users,
  ClipboardList,
  AlertTriangle,
  Wrench,
  Building2,
  Calendar,
  FileText,
  CalendarCheck,
  BarChart3,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/logements", label: "Logements", icon: Home },
  { href: "/proprietaires", label: "Propriétaires", icon: Users },
  { href: "/contrats", label: "Contrats", icon: FileText },
  { href: "/reservations", label: "Réservations", icon: CalendarCheck },
  { href: "/missions", label: "Missions", icon: ClipboardList },
  { href: "/calendrier", label: "Calendrier", icon: Calendar },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/prestataires", label: "Prestataires", icon: Wrench },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r">
      <div className="flex items-center gap-2 h-16 px-6 border-b">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-lg">ConciergeOS</span>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-gray-100 hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
