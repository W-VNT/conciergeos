"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Tabs } from "@/components/ui/tabs";
import { useCallback } from "react";

interface UrlTabsProps {
  defaultValue: string;
  children: React.ReactNode;
  className?: string;
}

export function UrlTabs({ defaultValue, children, className }: UrlTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get("tab") || defaultValue;

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === defaultValue) {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      const qs = params.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, searchParams, defaultValue]
  );

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className={className}>
      {children}
    </Tabs>
  );
}
