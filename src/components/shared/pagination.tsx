"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface PaginationProps {
  totalCount: number;
  pageSize?: number;
}

export function Pagination({ totalCount, pageSize = 20 }: PaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page") ?? "1");
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null;

  function goTo(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.replace(`${pathname}?${params.toString()}`);
  }

  const hasNext = currentPage < totalPages;

  return (
    <div className="mt-4 space-y-2">
      {/* Mobile: load more button */}
      {hasNext && (
        <Button
          variant="outline"
          className="w-full sm:hidden"
          onClick={() => goTo(currentPage + 1)}
        >
          Page suivante ({currentPage + 1}/{totalPages})
        </Button>
      )}

      {/* Desktop: prev/next with counter */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Page {currentPage} sur {totalPages} ({totalCount} résultats)
        </p>
        <div className="hidden sm:flex gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={currentPage <= 1}
            onClick={() => goTo(currentPage - 1)}
            aria-label="Page précédente"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            disabled={!hasNext}
            onClick={() => goTo(currentPage + 1)}
            aria-label="Page suivante"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
