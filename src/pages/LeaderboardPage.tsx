import { Container } from '@/lib/ui/Container';
import { LeaderboardTable } from '@/components/LeaderboardTable';

export function LeaderboardPage() {
  return (
    <div className="py-8">
      <Container>
        <div className="mb-6 space-y-1">
          <h1 className="text-h1 text-foreground">Leaderboard</h1>
          <p className="text-body text-muted-foreground">
            Every signed-in pilot's best run, ranked by survival score across the whole void.
          </p>
        </div>
        <LeaderboardTable />
      </Container>
    </div>
  );
}
