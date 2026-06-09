import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Calendar, Users, TrendingUp, Scissors, LogOut, 
  ShieldCheck, Settings, FileText, Shield, Smartphone 
} from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext'; 

export function Layout() {
  const location = useLocation();
  const { logout } = useContext(AuthContext); 

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* MENU LATERAL */}
      <aside className="w-72 bg-slate-900 text-slate-300 p-6 flex flex-col shadow-2xl z-20">
        <div className="flex items-center gap-3 text-white mb-12 px-2">
          <ShieldCheck size={32} className="text-blue-500" />
          <h2 className="text-2xl font-black tracking-tight">BioSchedule</h2>
        </div>

        <nav className="flex-1 space-y-2">
          <Link to="/dashboard" className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-medium ${isActive('/dashboard') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
            <TrendingUp size={20} /> Dashboard
          </Link>
          <Link to="/agenda" className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-medium ${isActive('/agenda') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Calendar size={20} /> Agenda
          </Link>
          <Link to="/pacientes" className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-medium ${isActive('/pacientes') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Users size={20} /> Pacientes
          </Link>
          <Link to="/servicos" className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-medium ${isActive('/servicos') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Scissors size={20} /> Procedimentos
          </Link>
          
          <Link to="/relatorios" className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-medium ${isActive('/relatorios') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
            <FileText size={20} /> Relatórios
          </Link>

          {/* Link da Equipe sempre visível */}
          <Link to="/equipe" className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-medium ${isActive('/equipe') ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Shield size={20} /> Equipe
          </Link>

          <Link to="/configuracoes" className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-medium ${isActive('/configuracoes') ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Settings size={20} /> Configurações
          </Link>
          <Link to="/whatsapp" className={`flex items-center gap-3 p-4 rounded-2xl transition-all font-medium ${isActive('/whatsapp') ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'hover:bg-slate-800 hover:text-white'}`}>
            <Smartphone size={20} /> WhatsApp
          </Link>
        </nav>

        <button 
          onClick={logout}
          className="flex items-center gap-3 p-4 rounded-2xl transition-all font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 mt-auto"
        >
          <LogOut size={20} /> Sair do Sistema
        </button>
      </aside>

      {/* ÁREA CENTRAL */}
      <main className="flex-1 p-10 overflow-y-auto h-screen relative custom-scrollbar">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}