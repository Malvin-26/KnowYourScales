import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/layout/Layout';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ScaleExplorerPage } from './pages/ScaleExplorerPage';
import { EarTrainingPage } from './pages/EarTrainingPage';
import { QuizPage } from './pages/QuizPage';
import { ChordProgressionsPage } from './pages/ChordProgressionsPage';
import { SongPracticePage } from './pages/SongPracticePage';
import { ProfilePage } from './pages/ProfilePage';
function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="scales" element={<ScaleExplorerPage />} />
        <Route path="ear-training" element={<EarTrainingPage />} />
        <Route path="quiz" element={<QuizPage />} />
        <Route path="chords" element={<ChordProgressionsPage />} />
        <Route path="songs" element={<SongPracticePage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
