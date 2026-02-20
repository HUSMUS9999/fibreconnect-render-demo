import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { api } from './lib/api';
import { getLanguage, setLanguage, Lang } from './lib/i18n';
import { ThemeProvider } from './lib/theme';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Interventions from './pages/Interventions';
import InterventionDetail from './pages/InterventionDetail';
import CreateIntervention from './pages/CreateIntervention';
import Planning from './pages/Planning';
import Technicians from './pages/Technicians';
import Clients from './pages/Clients';
import Users from './pages/Users';
import SLAReport from './pages/SLAReport';
import ClientPortal from './pages/ClientPortal';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  country: string;
  region?: string;
  city?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  lang: Lang;
  changeLang: (l: Lang) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  login: async () => {},
  logout: () => {},
  lang: 'fr',
  changeLang: () => {},
});

export const useAuth = () => useContext(AuthContext);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [lang, setLang] = useState<Lang>(getLanguage());

  const login = async (email: string, password: string) => {
    const data = await api.post('/auth/login', { email, password });
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const changeLang = (l: Lang) => {
    setLanguage(l);
    setLang(l);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, lang, changeLang }}>
      {children}
    </AuthContext.Provider>
  );
}

function PrivateRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/intervention/suivi/:token" element={<ClientPortal />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="interventions" element={<Interventions />} />
            <Route path="interventions/new" element={<CreateIntervention />} />
            <Route path="interventions/:id" element={<InterventionDetail />} />
            <Route path="planning" element={<Planning />} />
            <Route path="technicians" element={<Technicians />} />
            <Route path="clients" element={<Clients />} />
            <Route path="users" element={<Users />} />
            <Route path="sla" element={<SLAReport />} />
          </Route>
        </Routes>
      </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
