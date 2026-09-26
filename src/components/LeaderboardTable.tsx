import { useAppData } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/lib/ui/Card';
import { Badge } from '@/lib/ui/Badge';
import { EmptyState } from '@/lib/ui/EmptyState';
import { CenteredSpinner } from '@/lib/ui/Spinner';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { Button } from '@/lib/ui/Button';
import { Trophy, Medal, RefreshCw } from 'lucide-react';

export interface ScoreEntry {
  id: string;
  player_name: string;
  score: number;
  survival_seconds: number;
  created_at: string;
}

const MOCK_SCORES: ScoreEntry[] = [
  { id: 's1', player_name: 'Vex Sarn', score: 48210, survival_seconds: 312.4, created_at: '2024-05-02T14:12:00Z' },
  { id: 's2', player_name: 'Nova Pilot', score: 41890, survival_seconds: 276.1, created_at: '2024-05-04T09:41:00Z' },
  { id: 's3', player_name: 'Kestrel Zhao', score: 39770, survival_seconds: 264.8, created_at: '2024-04-28T21:03:00Z' },
  { id: 's4', player_name: 'Orin Vale', score: 37200, survival_seconds: 241.9, created_at: '2024-05-01T17:55:00Z' },
  { id: 's5', player_name: 'Ember Cross', score: 33510, survival_seconds: 219.6, created_at: '2024-04-30T11:18:00Z' },
  { id: 's6', player_name: 'Dax Ferro', score: 29840, survival_seconds: 198.3, created_at: '2024-04-27T06:44:00Z' },
  { id: 's7', player_name: 'Lyra Quinn', score: 26130, survival_seconds: 176.0, created_at: '2024-05-03T20:22:00Z' },
  { id: 's8', player_name: 'Iris Thorne', score: 21980, survival_seconds: 151.4, created_at: '2024-04-25T13:37:00Z' },
  { id: 's9', player_name: 'Rook Alden', score: 18450, survival_seconds: 129.7, created_at: '2024-04-29T08:09:00Z' },
  { id: 's10', player_name: 'Sable Kade', score: 14260, survival_seconds: 104.2, created_at: '2024-05-05T02:51:00Z' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function rankBadge(rank: number) {
  if (rank === 1) return <Badge variant="warning"><Medal size={12} className="mr-1" />1st</Badge>;
  if (rank === 2) return <Badge variant="outline"><Medal size={12} className="mr-1" />2nd</Badge>;
  if (rank === 3) return <Badge variant="outline"><Medal size={12} className="mr-1" />3rd</Badge>;
  return <Badge variant="default">{rank}</Badge>;
}

export function LeaderboardTable() {
  const { data, isLoading, error, refetch } = useAppData<ScoreEntry[]>({
    key: ['scores'],
    mock: MOCK_SCORES,
    fetchLive: async () => {
      throw new Error('not wired yet');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-16">
          <CenteredSpinner label="Loading leaderboard" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Couldn't load the leaderboard</AlertTitle>
        <AlertDescription className="flex items-center justify-between gap-4">
          <span>{(error as Error).message}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            <RefreshCw size={14} />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const sorted = [...(data ?? [])].sort((a, b) => b.score - a.score);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="inline-flex items-center gap-2">
          <Trophy size={18} className="text-primary" />
          Top pilots
        </CardTitle>
        <CardDescription>{sorted.length} runs banked to the shared leaderboard.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {sorted.length === 0 ? (
          <div className="px-6 pb-6">
            <EmptyState
              icon={<Trophy size={20} />}
              title="No scores yet"
              description="Be the first pilot to bank a run on the leaderboard."
            />
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {sorted.map((s, i) => (
              <li key={s.id} className="flex items-center gap-4 px-6 py-3">
                <div className="w-14 shrink-0">{rankBadge(i + 1)}</div>
                <span className="flex-1 truncate text-body text-foreground">{s.player_name}</span>
                <span className="text-small tabular-nums text-muted-foreground">
                  {s.survival_seconds.toFixed(1)}s
                </span>
                <span className="w-24 text-right text-body tabular-nums text-foreground">
                  {s.score.toLocaleString()}
                </span>
                <span className="hidden w-28 text-right text-small text-muted-foreground sm:block">
                  {formatDate(s.created_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
