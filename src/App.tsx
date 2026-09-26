import { BrowserRouter, Routes, Route, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { Nav, NavLink } from '@/lib/ui/Nav';
import { Rocket, Trophy, Radar } from 'lucide-react';
import { PlayPage } from '@/pages/PlayPage';
import { LeaderboardPage } from '@/pages/LeaderboardPage';
import { AuthMenu } from '@/components/AuthMenu';

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen">
      <Nav
        brand={
          <span className="inline-flex items-center gap-2">
            <Radar size={20} className="text-primary" />
            <span className="tracking-wide">VOIDRUNNER</span>
          </span>
        }
        actions={<AuthMenu />}
      >
        <NavLink href="/play" active={location.pathname === '/' || location.pathname === '/play'} onClick={(e: React.MouseEvent) => { e.preventDefault(); navigate('/play'); }}>
          <Rocket size={14} className="mr-2" />Play
        </NavLink>
        <NavLink href="/leaderboard" active={location.pathname === '/leaderboard'} onClick={(e: React.MouseEvent) => { e.preventDefault(); navigate('/leaderboard'); }}>
          <Trophy size={14} className="mr-2" />Leaderboard
        </NavLink>
      </Nav>
      <main>
        <Routes>
          <Route path="/" element={<Navigate to="/play" replace />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}
