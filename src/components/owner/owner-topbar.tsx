"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Building2,
  LogOut,
  LayoutDashboard,
  Home,
  CalendarDays,
  User,
  FileText,
  AlertTriangle,
  MessageCircle,
  Wallet,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Profile } from "@/types/database";
import { cn } from "@/lib/utils";

interface OwnerTopbarProps {
  profile: Profile;
  organisationName: string;
}

const navItems = [
  { href: "/owner/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/owner/logements", label: "Logements", icon: Home },
  { href: "/owner/reservations", label: "Réservations", icon: CalendarDays },
  { href: "/owner/contrats", label: "Contrats", icon: FileText },
  { href: "/owner/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/owner/messages", label: "Messages", icon: MessageCircle },
  { href: "/owner/finances", label: "Finances", icon: Wallet },
  { href: "/owner/profile", label: "Profil", icon: User },
];

export function OwnerTopbar({ profile, organisationName }: OwnerTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  function getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <header className="border-b bg-white dark:bg-gray-900 dark:border-gray-800">
      {/* Main topbar */}
      <div className="flex items-center justify-between px-4 md:px-6 h-14 sm:h-16">
        {/* Logo + org name */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-none">{organisationName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Espace propriétaire</p>
          </div>
        </div>

        {/* Right: theme + user */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="flex items-center gap-2 pl-2 border-l">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
              {getInitials(profile.full_name)}
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium leading-none">{profile.full_name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Propriétaire</p>
            </div>
            <button
              onClick={handleLogout}
              className="ml-1 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-muted-foreground"
              title="Déconnexion"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <nav className="flex items-center gap-0 px-4 md:px-6 overflow-x-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-colors",
                active
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
