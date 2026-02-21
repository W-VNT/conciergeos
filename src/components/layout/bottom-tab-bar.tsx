"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  Plus,
  Calendar,
  Menu,
  CalendarCheck,
  AlertTriangle,
  Home,
  Users,
  FileText,
  Wrench,
  DollarSign,
  BarChart3,
  Building2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const tabs = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/missions", label: "Missions", icon: ClipboardList },
  { href: "#new", label: "Nouveau", icon: Plus, isAction: true },
  { href: "/calendrier", label: "Calendrier", icon: Calendar },
  { href: "#menu", label: "Menu", icon: Menu, isAction: true },
];

const quickActions = [
  { href: "/missions/new", label: "Nouvelle mission", icon: ClipboardList },
  { href: "/reservations/new", label: "Nouvelle réservation", icon: CalendarCheck },
  { href: "/incidents/new", label: "Nouvel incident", icon: AlertTriangle },
];

const menuItems = [
  { href: "/logements", label: "Logements", icon: Home },
  { href: "/proprietaires", label: "Propriétaires", icon: Users },
  { href: "/contrats", label: "Contrats", icon: FileText },
  { href: "/reservations", label: "Réservations", icon: CalendarCheck },
  { href: "/incidents", label: "Incidents", icon: AlertTriangle },
  { href: "/prestataires", label: "Prestataires", icon: Wrench },
  { href: "/finances", label: "Finances", icon: DollarSign },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/organisation", label: "Organisation", icon: Building2, adminOnly: true },
];

interface BottomTabBarProps {
  isAdmin?: boolean;
}

export function BottomTabBar({ isAdmin = false }: BottomTabBarProps) {
  const pathname = usePathname();
  const [quickActionOpen, setQuickActionOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white dark:bg-gray-900 border-t dark:border-gray-800"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-5 h-16">
          {tabs.map((tab) => {
            const isActive =
              !tab.isAction && pathname.startsWith(tab.href);

            if (tab.href === "#new") {
              return (
                <button
                  key={tab.href}
                  onClick={() => setQuickActionOpen(true)}
                  className="flex flex-col items-center justify-center"
                >
                  <div className="flex items-center justify-center h-10 w-10 -mt-3 rounded-full bg-primary text-primary-foreground shadow-lg">
                    <Plus className="h-5 w-5" />
                  </div>
                </button>
              );
            }

            if (tab.href === "#menu") {
              return (
                <button
                  key={tab.href}
                  onClick={() => setMenuOpen(true)}
                  className="flex flex-col items-center justify-center gap-0.5 text-muted-foreground"
                >
                  <tab.icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium">{tab.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <tab.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Sheet: Créer */}
      <Sheet open={quickActionOpen} onOpenChange={setQuickActionOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Créer</SheetTitle>
          </SheetHeader>
          <div className="grid gap-2 py-4">
            {quickActions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                onClick={() => setQuickActionOpen(false)}
                className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary">
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheet: Menu */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-3 py-4">
            {menuItems.filter((item) => !item.adminOnly || isAdmin).map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-xl transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-muted-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
