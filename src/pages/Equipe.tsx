import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  UserPlus, Shield, User, Mail, Trash2, CheckCircle, 
  X, ShieldCheck, Stethoscope, Lock, Eye, EyeOff, AlertTriangle, UserCheck, ShieldAlert 
} from 'lucide-react';
import Swal from 'sweetalert2';

export function Equipe() {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Estados do Formulário
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    role: 'PROFISSIONAL'
  });

  // Pega o usuário logado para validar se é ADMIN
  const usuarioSalvo = localStorage.getItem('@BioSchedule:user');
  const adminLogado = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

  useEffect(() => {
    if (adminLogado?.role === 'ADMIN') {
      carregarEquipe();
    } else {
      setLoading(false);
    }
  }, []);

  async function carregarEquipe() {
    try {
      setLoading(true);
      const res = await api.get('/usuarios');
      setUsuarios(res.data);
    } catch (err) {
      console.error("Erro ao carregar equipe:", err);
    } finally {
      setLoading(false);
    }
  }

  // ✨ NOVA FUNÇÃO: Aprovar acesso do profissional
  async function handleAprovar(id: string) {
    try {
      await api.patch(`/usuarios/${id}`, { ativo: true });
      Swal.fire({
        icon: 'success',
        title: 'Acesso Liberado!',
        text: 'O profissional agora pode logar no sistema.',
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-[2rem]' }
      });
      carregarEquipe();
    } catch (err) {
      Swal.fire('Erro', 'Não foi possível aprovar o acesso.', 'error');
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/usuarios', formData);
      
      Swal.fire({
        icon: 'success',
        title: 'Membro Adicionado!',
        text: `${formData.nome} agora faz parte da equipe.`,
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: 'rounded-[2rem]' }
      });

      setIsModalOpen(false);
      setFormData({ nome: '', email: '', senha: '', role: 'PROFISSIONAL' });
      carregarEquipe();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erro ao cadastrar.';
      Swal.fire('Erro', Array.isArray(msg) ? msg[0] : msg, 'error');
    }
  }

  async function handleRemover(id: string, nome: string) {
    if (id === adminLogado?.id) {
      Swal.fire('Ação Negada', 'Você não pode remover seu próprio usuário.', 'warning');
      return;
    }

    const confirmacao = await Swal.fire({
      title: 'Tem certeza?',
      text: `Deseja remover ${nome} da equipe? Esta ação não pode ser desfeita.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Sim, remover!',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (confirmacao.isConfirmed) {
      try {
        await api.delete(`/usuarios/${id}`);
        Swal.fire('Removido!', 'O membro foi excluído com sucesso.', 'success');
        carregarEquipe();
      } catch (err: any) {
        Swal.fire('Erro', 'Não foi possível remover o membro.', 'error');
      }
    }
  }

  // Separação de listas para a lógica de aprovação
  const pendentes = usuarios.filter(u => !u.ativo);
  const ativos = usuarios.filter(u => u.ativo);

  if (adminLogado?.role !== 'ADMIN') {
    return (
      <div className="h-[70vh] flex items-center justify-center animate-slide-up">
        <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-slate-100 text-center max-w-lg relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-50 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-blue-50 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
              <ShieldCheck size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-800 mb-4 tracking-tight">Acesso Restrito</h2>
            <p className="text-slate-500 text-lg leading-relaxed mb-8">
              Esta área é exclusiva para <strong>Administradores</strong>.
            </p>
            <div className="flex items-center gap-2 text-indigo-600 font-bold bg-indigo-50 px-6 py-3 rounded-2xl">
              <AlertTriangle size={18} /> Solicite permissão ao gestor.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Shield className="text-blue-600" size={36} /> Gestão da Equipe
          </h1>
          <p className="text-slate-500 font-medium mt-2">Administre os profissionais e acessos do sistema.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 flex items-center gap-2"
        >
          <UserPlus size={20} /> Novo Membro
        </button>
      </div>

      {/* ✨ SEÇÃO DE SOLICITAÇÕES PENDENTES (Só aparece se houver alguém para aprovar) */}
      {!loading && pendentes.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-8 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-200 text-amber-700 rounded-xl">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-xl font-black text-amber-900 tracking-tight">Solicitações de Acesso</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendentes.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-2xl shadow-sm border border-amber-100 flex justify-between items-center group hover:border-amber-400 transition-all">
                <div>
                  <p className="font-bold text-slate-800">{p.nome}</p>
                  <p className="text-sm text-slate-500">{p.email}</p>
                </div>
                <button 
                  onClick={() => handleAprovar(p.id)}
                  className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-sm shadow-md shadow-amber-200"
                >
                  <UserCheck size={18} /> Aprovar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRID DE CARDS ATIVOS */}
      {loading ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ativos.map((user) => (
            <div key={user.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group animate-slide-up hover:shadow-md transition-all">
               <div className={`absolute top-0 right-0 w-20 h-20 -mr-8 -mt-8 rounded-full opacity-10 ${user.role === 'ADMIN' ? 'bg-indigo-600' : 'bg-blue-600'}`}></div>
               
               <div className="flex items-center gap-4 mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${user.role === 'ADMIN' ? 'bg-indigo-500' : 'bg-blue-500'}`}>
                    {user.role === 'ADMIN' ? <ShieldCheck size={28} /> : <Stethoscope size={28} />}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800">{user.nome}</h3>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{user.role}</span>
                  </div>
               </div>

               <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-sm text-slate-500 truncate"><Mail size={14}/> {user.email}</div>
                  <div className="flex items-center gap-2 text-sm text-emerald-600 font-bold"><CheckCircle size={14}/> Ativo no Sistema</div>
               </div>

               <button 
                onClick={() => handleRemover(user.id, user.nome)}
                className="w-full py-3 bg-slate-50 text-slate-400 rounded-xl hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 font-bold text-sm"
               >
                  <Trash2 size={16} /> Remover Membro
               </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL DE CADASTRO (Fica igual) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl scale-in">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800">Novo Profissional</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-rose-100 hover:text-rose-500 transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nome Completo</label>
                <div className="relative">
                  <User className="absolute left-4 top-4 text-slate-400" size={18} />
                  <input 
                    required
                    type="text" 
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" 
                    placeholder="Ex: Dr. Ricardo Silva"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">E-mail de Acesso</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 text-slate-400" size={18} />
                  <input 
                    required
                    type="email" 
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" 
                    placeholder="email@clinica.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Senha Temporária</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
                  <input 
                    required
                    type={showPassword ? "text" : "password"} 
                    value={formData.senha}
                    onChange={e => setFormData({...formData, senha: e.target.value})}
                    className="w-full p-4 pl-12 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-medium" 
                    placeholder="••••••••"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-4 text-slate-400 hover:text-blue-600"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2 ml-1">Nível de Acesso (Cargo)</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, role: 'PROFISSIONAL'})}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${formData.role === 'PROFISSIONAL' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}
                  >
                    Profissional
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, role: 'ADMIN'})}
                    className={`p-4 rounded-2xl border-2 font-bold text-sm transition-all ${formData.role === 'ADMIN' ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
                  >
                    Administrador
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-blue-600 text-white p-4 rounded-2xl font-bold text-lg shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all mt-4"
              >
                Cadastrar na Equipe
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .scale-in { animation: scaleIn 0.3s ease-out forwards; }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}