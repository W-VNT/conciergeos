import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type LucideIcon } from "lucide-react";
import Link from "next/link";

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  href?: string;
}

export function KpiCard({ title, value, description, icon: Icon, href }: KpiCardProps) {
  const content = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="h-full block">
        <Card className="h-full hover:shadow-md transition-shadow cursor-pointer hover:border-primary/20">
          {content}
        </Card>
      </Link>
    );
  }

  return <Card className="h-full">{content}</Card>;
}
