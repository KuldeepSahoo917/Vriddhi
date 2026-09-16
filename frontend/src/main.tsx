import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './styles/global.css';
import { AppShell } from './components/AppShell';
import { AuthProvider } from './lib/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { CalculatorPage } from './pages/CalculatorPage';
import { AuthPage } from './pages/AuthPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ComparePage } from './pages/ComparePage';

// Default to dark mode (matches Coboard). Respect a saved user
// preference if one exists; otherwise dark is the starting theme.
const savedTheme = localStorage.getItem('vriddhi-theme');
document.documentElement.setAttribute('data-theme', savedTheme ?? 'dark');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/calculator" element={<CalculatorPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/compare" element={<ComparePage />} />
          </Routes>
        </AppShell>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
