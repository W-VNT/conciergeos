/**
 * Breadcrumbs generation logic
 * Converts pathname to hierarchical navigation segments
 */

export type BreadcrumbSegment = {
  label: string;
  href: string;
};

// Maps path segments to human-readable French labels
const SEGMENT_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  logements: "Logements",
  missions: "Missions",
  contrats: "Contrats",
  incidents: "Incidents",
  reservations: "Réservations",
  proprietaires: "Propriétaires",
  prestataires: "Prestataires",
  calendrier: "Calendrier",
  finances: "Finances",
  notifications: "Notifications",
  analytics: "Analytique",
  organisation: "Organisation",
  account: "Compte",
  new: "Nouveau",
  edit: "Modifier",
  carte: "Carte",
};

/**
 * Generate breadcrumb segments from pathname
 * @param pathname - Current route pathname
 * @returns Array of breadcrumb segments with label and href
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbSegment[] {
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs: BreadcrumbSegment[] = [];

  let currentPath = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    currentPath += `/${segment}`;

    // Skip route groups like (dashboard), (auth), (owner)
    if (segment.startsWith("(") && segment.endsWith(")")) continue;

    // Get label from mapping or use segment as-is (for IDs)
    const label = SEGMENT_LABELS[segment] || segment;

    breadcrumbs.push({ label, href: currentPath });
  }

  return breadcrumbs;
}
