import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/lib/ui/Button';
import { LogIn, LogOut, UserCircle2 } from 'lucide-react';
import { useAppData } from '@/lib/data';

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
}

const MOCK_USER: CurrentUser = { id: 'user-nova-01', name: 'Nova Pilot', email: 'nova.pilot@voidrunner.gg' };

export function useCurrentUser() {
  return useAppData<CurrentUser | null>({
    key: ['currentUser'],
    mock: MOCK_USER,
    fetchLive: async () => {
      throw new Error('not wired yet');
    },
  });
}

export function AuthMenu() {
  const { data: user } = useCurrentUser();
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);

  const signOut = () => {
    setPending(true);
    qc.setQueryData(['currentUser'], null);
    setPending(false);
  };
  const signIn = () => {
    setPending(true);
    qc.setQueryData(['currentUser'], MOCK_USER);
    setPending(false);
  };

  if (!user) {
    return (
      <Button size="sm" onClick={signIn} disabled={pending}>
        <LogIn size={16} />
        Sign in
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className="hidden items-center gap-2 sm:flex">
        <UserCircle2 size={18} className="text-muted-foreground" />
        <span className="text-small text-foreground">{user.name}</span>
      </div>
      <Button size="sm" variant="ghost" onClick={signOut} disabled={pending} aria-label="Sign out">
        <LogOut size={16} />
      </Button>
    </div>
  );
}
