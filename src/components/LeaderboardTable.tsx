import { useQuery } from '@tanstack/react-query';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/lib/ui/Card';
import { EmptyState } from '@/lib/ui/EmptyState';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { Button } from '@/lib/ui/Button';
import { Badge } from '@/lib/ui/Badge';
import { Trophy, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface ScoreEntry {
  id: string;
  player_name: string;
  score: number;
  survival_seconds: number;
  created_at: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const rankMedal: Record<number, string> = { 0: '\u{1F947}', 1: '\u{1F948}', 2: '\u{1F949}' };

export function LeaderboardTable() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['scores'],
    queryFn: async (): Promise<ScoreEntry[]> => {
      const { data, error } = await supabase
        .from('scores')
        .select('id, player_name, score, survival_seconds, created_at')
        .order('score', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as ScoreEntry[];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>All-time leaderboard</CardTitle>
        <CardDescription>Top 50 runs across every signed-in pilot, ranked by score.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="py-12">
            <CenteredSpinner label="Loading leaderboard" />
          </div>
        ) : error ? (
          <div className="px-6 pb-6">
            <Alert variant="destructive">
              <AlertTitle>Couldn't load leaderboard</AlertTitle>
              <AlertDescription>{(error as Error).message}</AlertDescription>
            </Alert>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => refetch()} disabled={isFetching}>
              <RotateCcw size={14} />
              Retry
            </Button>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              icon={<Trophy size={20} />}
              title="No runs yet"
              description="Be the first pilot to bank a score on the shared leaderboard."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {data.map((entry, i) => (
              <li key={entry.id} className="flex items-center gap-4 px-6 py-3">
                <div className="flex w-8 items-center justify-center text-small tabular-nums text-muted-foreground">
                  {rankMedal[i] ?? `#${i + 1}`}
                </div>
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-micro text-muted-foreground">
                  {entry.player_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 truncate text-body text-foreground">{entry.player_name}</div>
                <Badge variant="outline" className="tabular-nums">
                  {entry.survival_seconds.toFixed(1)}s
                </Badge>
                <div className="w-20 shrink-0 text-right text-body font-medium tabular-nums text-foreground">
                  {entry.score.toLocaleString()}
                </div>
                <div className="hidden w-24 shrink-0 text-right text-small tabular-nums text-muted-foreground sm:block">
                  {formatDate(entry.created_at)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
