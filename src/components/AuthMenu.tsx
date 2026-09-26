import { useCallback, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/lib/ui/Button';
import { Input } from '@/lib/ui/Input';
import { LogIn, LogOut, Mail, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
}

export function useCurrentUser() {
  const qc = useQueryClient();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      qc.invalidateQueries({ queryKey: ['auth-user'] });
    });
    return () => sub.subscription.unsubscribe();
  }, [qc]);

  return useQuery({
    queryKey: ['auth-user'],
    queryFn: async (): Promise<CurrentUser | null> => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) return null;
      const u = data.user;
      const name =
        (u.user_metadata?.name as string | undefined) ||
        (u.email ? u.email.split('@')[0] : 'Player');
      return { id: u.id, email: u.email ?? '', name };
    },
    staleTime: 30_000,
  });
}

export function AuthMenu() {
  const { data: user, isLoading } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendLink = useCallback(async () => {
    if (!email.trim()) return;
    setSending(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    });
    setSending(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSent(true);
  }, [email]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  if (isLoading) {
    return <div className="h-8 w-24 rounded-md skeleton" />;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 rounded-full bg-surface px-3 py-1.5 sm:flex">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-micro text-primary-foreground">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <span className="text-small text-foreground">{user.name}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} aria-label="Sign out">
          <LogOut size={16} />
        </Button>
      </div>
    );
  }

  if (open) {
    return (
      <div className="flex items-center gap-2">
        {sent ? (
          <div className="inline-flex items-center gap-1.5 text-small text-success">
            <CheckCircle2 size={16} />
            Check your email
          </div>
        ) : (
          <>
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-8 w-40 text-small sm:w-48"
              onKeyDown={(e) => {
                if (e.key === 'Enter') sendLink();
              }}
            />
            <Button size="sm" onClick={sendLink} disabled={sending}>
              <Mail size={14} />
              {sending ? 'Sending…' : 'Send link'}
            </Button>
          </>
        )}
        {error && <span className="text-micro text-destructive">{error}</span>}
      </div>
    );
  }

  return (
    <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
      <LogIn size={16} />
      Sign in
    </Button>
  );
}
