import { requireProfile, isAdmin } from "@/lib/auth";
import { getCalendarData, getCalendarFilters } from "@/lib/actions/calendar";
import Calendar from "@/components/calendrier/calendar";
import { IcalExportButton } from "@/components/calendrier/ical-export-button";
import { ConflictAlert } from "@/components/calendrier/conflict-alert";
import { detectConflicts } from "@/lib/actions/calendar-conflicts";

export const metadata = { title: "Calendrier" };
export const dynamic = "force-dynamic";

interface CalendrierPageProps {
  searchParams: { month?: string; year?: string };
}

export default async function CalendrierPage({
  searchParams,
}: CalendrierPageProps) {
  const profile = await requireProfile();

  const now = new Date();
  const month = searchParams.month
    ? parseInt(searchParams.month, 10)
    : now.getMonth() + 1; // 1-indexed
  const year = searchParams.year
    ? parseInt(searchParams.year, 10)
    : now.getFullYear();

  // Validate month and year
  const validMonth = month >= 1 && month <= 12 ? month : now.getMonth() + 1;
  const validYear =
    year >= 2020 && year <= 2100 ? year : now.getFullYear();

  // Calculate date range for conflict detection (same as calendar data range)
  const startDate = new Date(validYear, validMonth - 1, 1);
  startDate.setDate(startDate.getDate() - 7);
  const rangeStart = startDate.toISOString().split("T")[0];

  const endDate = new Date(validYear, validMonth, 0); // Last day of month
  endDate.setDate(endDate.getDate() + 8);
  const rangeEnd = endDate.toISOString().split("T")[0];

  // Fetch data in parallel
  const [{ missions, reservations }, { logements, operators }, conflicts] =
    await Promise.all([
      getCalendarData(validMonth, validYear),
      getCalendarFilters(),
      detectConflicts(rangeStart, rangeEnd),
    ]);

  const admin = isAdmin(profile);

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Calendrier</h1>
          <p className="text-muted-foreground mt-2">
            Vue mensuelle des missions et reservations
          </p>
        </div>
        {admin && (
          <IcalExportButton organisationId={profile.organisation_id} />
        )}
      </div>

      {/* Conflict detection alert */}
      <div className="mb-4">
        <ConflictAlert conflicts={conflicts} />
      </div>

      <Calendar
        missions={missions}
        reservations={reservations}
        logements={logements}
        operators={operators}
        initialMonth={validMonth}
        initialYear={validYear}
      />
    </div>
  );
}
