import { requireProfile } from "@/lib/auth";
import { getLeaderboard } from "@/lib/actions/gamification";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";

const PODIUM_COLORS = ["text-yellow-500", "text-gray-400", "text-amber-600"];
const PODIUM_ICONS = [Trophy, Medal, Award];

export default async function LeaderboardPage() {
  const profile = await requireProfile();
  const leaderboard = await getLeaderboard();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/missions"><Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Trophy className="h-6 w-6" />Classement opérateurs</h1>
          <p className="text-sm text-muted-foreground">Points et badges gagnés par les opérateurs</p>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <Card><CardContent className="pt-6 text-center"><p className="text-muted-foreground">Aucun point attribué pour le moment.</p></CardContent></Card>
      ) : (
        <>
          {/* Podium */}
          <div className="grid gap-4 sm:grid-cols-3">
            {leaderboard.slice(0, 3).map((op, i) => {
              const Icon = PODIUM_ICONS[i];
              return (
                <Card key={op.id} className={i === 0 ? "border-yellow-300 bg-yellow-50/30 dark:bg-yellow-950/10" : ""}>
                  <CardContent className="pt-6 text-center">
                    <Icon className={`h-8 w-8 mx-auto mb-2 ${PODIUM_COLORS[i]}`} />
                    <p className="font-semibold text-lg">{op.name}</p>
                    <p className="text-2xl font-bold mt-1">{op.totalPoints} pts</p>
                    {op.badges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2 justify-center">
                        {op.badges.map((b) => (
                          <span key={b.code} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{b.label}</span>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Full table */}
          <Card>
            <CardHeader><CardTitle>Classement complet</CardTitle></CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead><tr className="border-b text-muted-foreground">
                  <th className="text-left py-2 w-12">#</th>
                  <th className="text-left py-2">Opérateur</th>
                  <th className="text-right py-2">Points</th>
                  <th className="text-left py-2">Badges</th>
                </tr></thead>
                <tbody>
                  {leaderboard.map((op, i) => (
                    <tr key={op.id} className="border-b">
                      <td className="py-2 font-medium">{i + 1}</td>
                      <td className="py-2 font-medium">{op.name}</td>
                      <td className="py-2 text-right font-semibold">{op.totalPoints}</td>
                      <td className="py-2">
                        <div className="flex flex-wrap gap-1">
                          {op.badges.map((b) => (
                            <span key={b.code} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted">{b.label}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
