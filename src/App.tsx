import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { BottomNav, Toasts } from './components/ui';
import { useStore } from './lib/store';
import { ExerciseDetail } from './pages/ExerciseDetail';
import { Exercises } from './pages/Exercises';
import { FitnessTestPage } from './pages/FitnessTest';
import { Coop } from './pages/Coop';
import { Home } from './pages/Home';
import { Onboarding } from './pages/Onboarding';
import { ProgramDetail } from './pages/ProgramDetail';
import { Programs } from './pages/Programs';
import { Progress } from './pages/Progress';
import { Settings } from './pages/Settings';
import { Summary } from './pages/Summary';
import { WorkoutPlayer } from './pages/WorkoutPlayer';

const FULLSCREEN = ['/treino', '/resumo', '/teste'];

export function App() {
  const { state } = useStore();
  const { pathname } = useLocation();
  const theme = state.settings.theme;

  useEffect(() => {
    if (theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  if (!state.profile) return <Onboarding />;

  const fullscreen = FULLSCREEN.some((p) => pathname.startsWith(p));

  return (
    <div className={`app ${fullscreen ? 'app-full' : ''}`}>
      <main className="page">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/treinos" element={<Programs />} />
          <Route path="/treinos/:id" element={<ProgramDetail />} />
          <Route path="/exercicios" element={<Exercises />} />
          <Route path="/exercicios/:id" element={<ExerciseDetail />} />
          <Route path="/progresso" element={<Progress />} />
          <Route path="/galinheiro" element={<Coop />} />
          <Route path="/ajustes" element={<Settings />} />
          <Route path="/treino" element={<WorkoutPlayer />} />
          <Route path="/resumo" element={<Summary />} />
          <Route path="/teste" element={<FitnessTestPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!fullscreen && <BottomNav />}
      <Toasts />
    </div>
  );
}
