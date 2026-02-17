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
  DollarSign,
} from "lucide-react";
import type { Profile, Organisation } from "@/types/database";

const navGroups = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/calendrier", label: "Calendrier", icon: Calendar },
      { href: "/analytics", label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Patrimoine",
    items: [
      { href: "/logements", label: "Logements", icon: Home },
      { href: "/proprietaires", label: "Propriétaires", icon: Users },
      { href: "/contrats", label: "Contrats", icon: FileText },
    ],
  },
  {
    label: "Activité",
    items: [
      { href: "/reservations", label: "Réservations", icon: CalendarCheck },
      { href: "/missions", label: "Missions", icon: ClipboardList },
      { href: "/incidents", label: "Incidents", icon: AlertTriangle },
      { href: "/prestataires", label: "Prestataires", icon: Wrench },
    ],
  },
  {
    label: "Finances",
    items: [
      { href: "/finances", label: "Finances", icon: DollarSign },
    ],
  },
];

interface SidebarProps {
  profile: Profile;
  organisation: Organisation | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(name: string): string {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-teal-500",
    "bg-red-500",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}

export function Sidebar({ profile, organisation }: SidebarProps) {
  const pathname = usePathname();
  const isAdmin = profile.role === "ADMIN";

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white dark:bg-gray-900 border-r dark:border-gray-800">
      <div className="flex items-center gap-2 h-16 px-6 border-b dark:border-gray-800">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-lg">ConciergeOS</span>
      </div>
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {navGroups.map((group, groupIndex) => (
          <div key={groupIndex} className={groupIndex > 0 ? "mt-4" : ""}>
            {group.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      {/* Organisation footer */}
      {organisation && (
        <div className="border-t dark:border-gray-800 px-3 py-4">
          {isAdmin ? (
            <Link
              href="/organisation"
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                pathname.startsWith("/organisation")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-foreground"
              )}
              title="Paramètres de l'organisation"
            >
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                  organisation.logo_url
                    ? "bg-transparent"
                    : getAvatarColor(organisation.name)
                }`}
              >
                {organisation.logo_url ? (
                  <img
                    src={organisation.logo_url}
                    alt={organisation.name}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  getInitials(organisation.name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{organisation.name}</p>
                <p className="text-xs text-muted-foreground">Organisation</p>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 px-3 py-2.5">
              <div
                className={`h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                  organisation.logo_url
                    ? "bg-transparent"
                    : getAvatarColor(organisation.name)
                }`}
              >
                {organisation.logo_url ? (
                  <img
                    src={organisation.logo_url}
                    alt={organisation.name}
                    className="h-full w-full object-cover rounded-full"
                  />
                ) : (
                  getInitials(organisation.name)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground truncate">
                  {organisation.name}
                </p>
                <p className="text-xs text-muted-foreground">Organisation</p>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}
