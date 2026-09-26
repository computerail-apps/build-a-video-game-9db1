import { Container } from '@/lib/ui/Container';
import { GameCanvas } from '@/components/GameCanvas';

export function PlayPage() {
  return (
    <div className="py-8">
      <Container>
        <div className="mb-6 space-y-1">
          <h1 className="text-h1 text-foreground">Dodge the void</h1>
          <p className="text-body text-muted-foreground">
            Steer with arrow keys, WASD, or drag on touch. Every second alive raises the asteroid speed.
            Sign in to bank your run on the shared leaderboard.
          </p>
        </div>
        <GameCanvas />
      </Container>
    </div>
  );
}
