"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Settings, LogOut, ChevronDown } from "lucide-react";
import type { Profile } from "@/types/database";
import { USER_ROLE_LABELS } from "@/types/database";

interface UserMenuProps {
  profile: Profile;
}

export function UserMenu({ profile }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

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

  function getAvatarColor(name: string): string {
    // Generate consistent color based on name
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

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button - Mobile optimized */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 sm:gap-3 hover:opacity-80 transition-opacity"
        aria-label="Menu utilisateur"
        aria-expanded={isOpen}
        aria-haspopup="menu"
      >
        {/* Avatar with online status */}
        <div className="relative">
          <div
            className={`h-9 w-9 sm:h-10 sm:w-10 rounded-full overflow-hidden flex items-center justify-center ${
              profile.avatar_url ? "bg-transparent" : `${getAvatarColor(profile.full_name)} text-white`
            }`}
          >
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs sm:text-sm font-semibold">
                {getInitials(profile.full_name)}
              </span>
            )}
          </div>
          {/* Online status indicator */}
          <div className="absolute bottom-0 right-0 h-2.5 w-2.5 sm:h-3 sm:w-3 bg-green-500 border-2 border-background rounded-full" />
        </div>

        {/* Name and role (hidden on mobile) */}
        <div className="hidden md:block text-left">
          <p className="text-sm font-medium">{profile.full_name}</p>
          <p className="text-xs text-muted-foreground">
            {USER_ROLE_LABELS[profile.role]}
          </p>
        </div>

        {/* Chevron indicator (hidden on mobile) */}
        <ChevronDown
          className={`h-4 w-4 text-muted-foreground transition-transform hidden md:block ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-popover rounded-lg shadow-lg border border-border z-50" role="menu">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div
                className={`h-12 w-12 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 ${
                  profile.avatar_url ? "bg-transparent" : `${getAvatarColor(profile.full_name)} text-white`
                }`}
              >
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-base font-semibold">
                    {getInitials(profile.full_name)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{profile.full_name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {profile.email}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {USER_ROLE_LABELS[profile.role]}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <button
              role="menuitem"
              onClick={() => {
                setIsOpen(false);
                router.push("/account");
              }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-accent transition-colors text-left"
            >
              <Settings className="h-4 w-4 text-muted-foreground" />
              Mon profil
            </button>

            <div className="border-t border-border my-2" />

            <button
              role="menuitem"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors text-left"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
