import { requireProfile, isAdmin } from "@/lib/auth";
import { getCalendarData, getCalendarFilters } from "@/lib/actions/calendar";
import Calendar from "@/components/calendrier/calendar";
import { IcalExportButton } from "@/components/calendrier/ical-export-button";

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

  // Fetch data in parallel
  const [{ missions, reservations }, { logements, operators }] =
    await Promise.all([
      getCalendarData(validMonth, validYear),
      getCalendarFilters(),
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
