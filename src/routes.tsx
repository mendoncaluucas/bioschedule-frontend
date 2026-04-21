import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useContext, type ReactNode } from 'react'; 

// Importação do contexto e do layout
import { AuthProvider, AuthContext } from './contexts/AuthContext';
import { Layout } from './components/Layout';

// Importação das páginas
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Pacientes } from './pages/Pacientes';
import { Agenda } from './pages/Agenda';
import { Servicos } from './pages/Servicos';
import { Relatorios } from './pages/Relatorios';
import { Equipe } from './pages/Equipe'; 
import { Configuracoes } from './pages/Configuracoes';
import { Agendar } from './pages/Agendar'; // ✨ IMPORTAÇÃO DA NOVA TELA

// COMPONENTE DE TRAVA (PrivateRoute)
function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useContext(AuthContext);
  
  // Se estiver logado, renderiza a tela. Se não, manda pro Login (/)
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
}

export function AppRoutes() {
  return (
    <BrowserRouter>
      {/* O AuthProvider deve estar DENTRO do BrowserRouter para poder usar o useNavigate */}
      <AuthProvider>
        <Routes>
          {/* 🟢 ROTAS PÚBLICAS (Qualquer pessoa pode acessar sem estar logada) */}
          <Route path="/" element={<Login />} />
          <Route path="/agendar" element={<Agendar />} /> {/* ✨ ROTA PÚBLICA LIBERADA AQUI */}

          {/* 🔴 ROTAS PRIVADAS trancadas pelo <PrivateRoute> e usando o <Layout> */}
          <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/agenda" element={<Agenda />} />
            <Route path="/pacientes" element={<Pacientes />} />
            <Route path="/servicos" element={<Servicos />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/equipe" element={<Equipe />} />
            <Route path="/configuracoes" element={<Configuracoes />} />
          </Route>

          {/* Redirecionamento de segurança para rotas inexistentes */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}