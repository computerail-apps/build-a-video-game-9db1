import { Container } from '@/lib/ui/Container';
import { LeaderboardTable } from '@/components/LeaderboardTable';

export function LeaderboardPage() {
  return (
    <div className="py-6 md:py-8">
      <Container>
        <div className="mb-6 space-y-1">
          <h1 className="text-h1 text-foreground">All-time leaderboard</h1>
          <p className="text-body text-muted-foreground">Ranked by best survival score across every pilot.</p>
        </div>
        <LeaderboardTable />
      </Container>
    </div>
  );
}
