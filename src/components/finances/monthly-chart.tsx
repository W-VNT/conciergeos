"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

interface MonthlyChartProps {
  data: {
    mois: string;
    ca_brut: number;
    commissions: number;
    marge: number;
  }[];
}

const FRENCH_MONTHS: Record<string, string> = {
  "01": "Jan",
  "02": "Fév",
  "03": "Mar",
  "04": "Avr",
  "05": "Mai",
  "06": "Juin",
  "07": "Juil",
  "08": "Aoû",
  "09": "Sep",
  "10": "Oct",
  "11": "Nov",
  "12": "Déc",
};

function formatMonthLabel(mois: string): string {
  // mois format: "YYYY-MM-DD" or "YYYY-MM"
  const parts = mois.split("-");
  const monthKey = parts[1];
  const year = parts[0].slice(2); // "2026" -> "26"
  return `${FRENCH_MONTHS[monthKey] ?? monthKey} ${year}`;
}

function formatEur(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="rounded-lg border bg-background p-3 shadow-md">
      <p className="mb-2 text-sm font-medium">{label}</p>
      {payload.map((entry) => (
        <div key={entry.name} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-3 w-3 rounded-sm"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name} :</span>
          <span className="font-medium">{formatEur(entry.value)}</span>
        </div>
      ))}
    </div>
  );
}

export function MonthlyChart({ data }: MonthlyChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatMonthLabel(d.mois),
  }));

  if (chartData.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Aucune donnée mensuelle sur cette période
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
        <XAxis
          dataKey="label"
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tickFormatter={(v) => formatEur(v)}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          iconType="square"
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Bar
          dataKey="ca_brut"
          name="CA Brut"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="commissions"
          name="Commissions"
          fill="#10b981"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          dataKey="marge"
          name="Marge"
          fill="#f59e0b"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
