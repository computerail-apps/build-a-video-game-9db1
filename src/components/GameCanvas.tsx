import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/lib/ui/Card';
import { Button } from '@/lib/ui/Button';
import { Alert, AlertTitle, AlertDescription } from '@/lib/ui/Alert';
import { Rocket, Trophy, RotateCcw, Send, CheckCircle2 } from 'lucide-react';
import { useCurrentUser } from '@/components/AuthMenu';
import { supabase } from '@/lib/supabase';

type Phase = 'idle' | 'playing' | 'dead';

interface Vec {
  x: number;
  y: number;
}

interface Asteroid extends Vec {
  vx: number;
  vy: number;
  r: number;
  spin: number;
  rot: number;
}

const SHIP_RADIUS = 10;
const BASE_SPAWN_MS = 850;
const MIN_SPAWN_MS = 180;

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<Phase>('idle');
  const [score, setScore] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [finalElapsed, setFinalElapsed] = useState(0);
  const [submitState, setSubmitState] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { data: user } = useCurrentUser();
  const qc = useQueryClient();

  // mutable game state kept in refs so the RAF loop doesn't fight React re-renders
  const shipRef = useRef<Vec>({ x: 0, y: 0 });
  const trailRef = useRef<Vec[]>([]);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const pointerRef = useRef<Vec | null>(null);
  const lastSpawnRef = useRef(0);
  const startTimeRef = useRef(0);
  const rafRef = useRef(0);
  const scoreRef = useRef(0);
  const sizeRef = useRef({ w: 0, h: 0 });

  const resize = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sizeRef.current = { w, h };
  }, []);

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [resize]);

  const startGame = useCallback(() => {
    resize();
    const { w, h } = sizeRef.current;
    shipRef.current = { x: w / 2, y: h * 0.75 };
    trailRef.current = [];
    asteroidsRef.current = [];
    scoreRef.current = 0;
    lastSpawnRef.current = 0;
    startTimeRef.current = performance.now();
    setScore(0);
    setElapsed(0);
    setSubmitState('idle');
    setSubmitError(null);
    setPhase('playing');
  }, [resize]);

  const endGame = useCallback(() => {
    setPhase('dead');
    setFinalScore(Math.floor(scoreRef.current));
    setFinalElapsed((performance.now() - startTimeRef.current) / 1000);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    let mounted = true;

    const loop = (t: number) => {
      if (!mounted) return;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }
      const { w, h } = sizeRef.current;
      const survival = (t - startTimeRef.current) / 1000;
      const difficulty = 1 + survival * 0.09;

      // move ship
      const speed = 4.2;
      const ship = shipRef.current;
      const keys = keysRef.current;
      if (keys['arrowleft'] || keys['a']) ship.x -= speed;
      if (keys['arrowright'] || keys['d']) ship.x += speed;
      if (keys['arrowup'] || keys['w']) ship.y -= speed;
      if (keys['arrowdown'] || keys['s']) ship.y += speed;
      if (pointerRef.current) {
        const dx = pointerRef.current.x - ship.x;
        const dy = pointerRef.current.y - ship.y;
        ship.x += dx * 0.15;
        ship.y += dy * 0.15;
      }
      ship.x = Math.max(SHIP_RADIUS, Math.min(w - SHIP_RADIUS, ship.x));
      ship.y = Math.max(SHIP_RADIUS, Math.min(h - SHIP_RADIUS, ship.y));

      trailRef.current.push({ x: ship.x, y: ship.y });
      if (trailRef.current.length > 22) trailRef.current.shift();

      // spawn asteroids
      const spawnInterval = Math.max(MIN_SPAWN_MS, BASE_SPAWN_MS - survival * 22);
      if (t - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = t;
        const r = 10 + Math.random() * 22;
        const fromLeft = Math.random() > 0.5;
        asteroidsRef.current.push({
          x: fromLeft ? -r : w + r,
          y: Math.random() * h * 0.85,
          vx: (fromLeft ? 1 : -1) * (1.2 + Math.random() * 1.8) * difficulty,
          vy: 0.4 + Math.random() * 1.6,
          r,
          spin: (Math.random() - 0.5) * 0.08,
          rot: 0,
        });
      }

      // update asteroids
      asteroidsRef.current.forEach((a) => {
        a.x += a.vx;
        a.y += a.vy * difficulty;
        a.rot += a.spin;
      });
      asteroidsRef.current = asteroidsRef.current.filter(
        (a) => a.x > -60 && a.x < w + 60 && a.y < h + 60,
      );

      // collision
      for (const a of asteroidsRef.current) {
        const dx = a.x - ship.x;
        const dy = a.y - ship.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < a.r + SHIP_RADIUS * 0.7) {
          endGame();
          return;
        }
      }

      scoreRef.current += 1 * difficulty;
      setScore(Math.floor(scoreRef.current));
      setElapsed(survival);

      // ---- render ----
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#05060a';
      ctx.fillRect(0, 0, w, h);

      // starfield (static-ish, cheap)
      ctx.fillStyle = 'rgba(148,163,184,0.35)';
      for (let i = 0; i < 60; i++) {
        const sx = (i * 97) % w;
        const sy = (i * 53 + Math.floor(survival * 6)) % h;
        ctx.fillRect(sx, sy, 1.4, 1.4);
      }

      // trail
      trailRef.current.forEach((p, i) => {
        const alpha = (i / trailRef.current.length) * 0.5;
        ctx.beginPath();
        ctx.fillStyle = `rgba(34,211,238,${alpha})`;
        ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
        ctx.fill();
      });

      // asteroids
      asteroidsRef.current.forEach((a) => {
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(a.rot);
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(248,113,113,0.9)';
        ctx.fillStyle = 'rgba(127,29,29,0.35)';
        ctx.lineWidth = 1.5;
        const spikes = 7;
        for (let i = 0; i < spikes; i++) {
          const ang = (i / spikes) * Math.PI * 2;
          const rr = a.r * (0.8 + (i % 2 === 0 ? 0.2 : -0.1));
          const px = Math.cos(ang) * rr;
          const py = Math.sin(ang) * rr;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      });

      // ship glow + body
      ctx.save();
      ctx.shadowColor = 'rgba(34,211,238,0.9)';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.fillStyle = '#22d3ee';
      ctx.arc(ship.x, ship.y, SHIP_RADIUS, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [phase, endGame]);

  const handlePointer = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    pointerRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);
  const clearPointer = useCallback(() => {
    pointerRef.current = null;
  }, []);

  const submitScore = useCallback(async () => {
    if (!user) return;
    setSubmitState('submitting');
    setSubmitError(null);
    try {
      const { error } = await supabase.from('scores').insert({
        player_name: user.name,
        score: finalScore,
        survival_seconds: Number(finalElapsed.toFixed(1)),
      });
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['scores'] });
      setSubmitState('done');
    } catch (err) {
      setSubmitError((err as Error).message);
      setSubmitState('error');
    }
  }, [user, finalScore, finalElapsed, qc]);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div
          ref={wrapRef}
          className="relative h-[70vh] min-h-[420px] w-full select-none bg-background"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full touch-none"
            onPointerMove={handlePointer}
            onPointerLeave={clearPointer}
          />

          {/* HUD */}
          {phase === 'playing' && (
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
              <div className="rounded-lg bg-surface/70 px-3 py-1.5 backdrop-blur">
                <div className="text-micro uppercase tracking-wide text-muted-foreground">Score</div>
                <div className="text-h3 tabular-nums text-foreground">{score.toLocaleString()}</div>
              </div>
              <div className="rounded-lg bg-surface/70 px-3 py-1.5 text-right backdrop-blur">
                <div className="text-micro uppercase tracking-wide text-muted-foreground">Survival</div>
                <div className="text-h3 tabular-nums text-foreground">{elapsed.toFixed(1)}s</div>
              </div>
            </div>
          )}

          {phase === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/70 p-6 text-center backdrop-blur-sm">
              <Rocket size={40} className="text-primary" />
              <div className="space-y-1">
                <h2 className="text-h2 text-foreground">Ready to run?</h2>
                <p className="max-w-sm text-body text-muted-foreground">
                  Use arrow keys, WASD, or drag on touch screens. Every second alive raises the difficulty.
                </p>
              </div>
              <Button onClick={startGame}>
                <Rocket size={16} />
                Start run
              </Button>
            </div>
          )}

          {phase === 'dead' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-background/85 p-6 text-center backdrop-blur-sm">
              <Trophy size={36} className="text-warning" />
              <div className="space-y-1">
                <h2 className="text-h2 text-foreground">Run over</h2>
                <p className="text-body text-muted-foreground">
                  Final score <span className="tabular-nums text-foreground">{finalScore.toLocaleString()}</span> ·{' '}
                  {finalElapsed.toFixed(1)}s survived
                </p>
              </div>

              {!user ? (
                <Alert variant="default" className="max-w-sm text-left">
                  <AlertTitle>Sign in to submit</AlertTitle>
                  <AlertDescription>Sign in from the top bar to bank this score on the shared leaderboard.</AlertDescription>
                </Alert>
              ) : submitState === 'done' ? (
                <div className="inline-flex items-center gap-2 text-small text-success">
                  <CheckCircle2 size={16} />
                  Submitted to the leaderboard as {user.name}
                </div>
              ) : submitState === 'error' ? (
                <Alert variant="destructive" className="max-w-sm text-left">
                  <AlertTitle>Couldn't submit score</AlertTitle>
                  <AlertDescription>{submitError ?? 'Something went wrong. Try again.'}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-wrap items-center justify-center gap-3">
                {user && submitState !== 'done' && (
                  <Button onClick={submitScore} disabled={submitState === 'submitting'}>
                    <Send size={16} />
                    {submitState === 'submitting' ? 'Submitting…' : 'Submit score'}
                  </Button>
                )}
                <Button variant="outline" onClick={startGame}>
                  <RotateCcw size={16} />
                  Run it back
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
