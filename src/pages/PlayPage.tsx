import { Container } from '@/lib/ui/Container';
import { GameCanvas } from '@/components/GameCanvas';

export function PlayPage() {
  return (
    <div className="py-6 md:py-8">
      <Container>
        <div className="mb-6 space-y-1">
          <h1 className="text-h1 text-foreground">Dodge the void.</h1>
          <p className="text-body text-muted-foreground">
            Steer your ship with arrow keys, WASD, or touch. Asteroids accelerate the longer you survive — bank your
            score to the shared leaderboard when you go down.
          </p>
        </div>
        <GameCanvas />
      </Container>
    </div>
  );
}
