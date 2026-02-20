"use client";

import { Fragment } from "react";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ChevronRight, Home } from "lucide-react";
import { generateBreadcrumbs } from "@/lib/breadcrumbs";

interface BreadcrumbsProps {
  /**
   * Optional: Override auto-generated breadcrumbs with custom segments
   */
  customSegments?: Array<{ label: string; href: string }>;
  /**
   * Optional: Entity name for [id] segments (e.g., "Appartement 2584A")
   * Replaces UUID with human-readable name
   */
  entityName?: string;
}

export function Breadcrumbs({ customSegments, entityName }: BreadcrumbsProps) {
  const pathname = usePathname();
  const segments = customSegments || generateBreadcrumbs(pathname);

  // Replace last segment with entityName if provided and it's a UUID
  if (entityName && segments.length > 0) {
    const lastSegment = segments[segments.length - 1];
    // Check if last segment looks like a UUID (36 chars with dashes)
    if (lastSegment.label.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      lastSegment.label = entityName;
    }
  }

  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        {/* Home icon */}
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">
            <Home className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;

          return (
            <Fragment key={segment.href}>
              <BreadcrumbSeparator>
                <ChevronRight className="h-4 w-4" />
              </BreadcrumbSeparator>

              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{segment.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={segment.href}>
                    {segment.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
