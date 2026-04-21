import { useState, useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Lock, Mail, ArrowRight, ShieldCheck, User, Sparkles } from 'lucide-react';
import Swal from 'sweetalert2';

export function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  
  const { login } = useContext(AuthContext);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (isLogin) {
      try {
        await login(email, senha);
      } catch (err: any) {
        // Se o erro for 403, significa que o usuário existe mas está inativo (pendente)
        const isPendente = err.response?.status === 403;

        Swal.fire({
          icon: 'error',
          title: isPendente ? 'Acesso Pendente' : 'Erro ao Entrar',
          text: isPendente 
            ? 'Sua conta ainda não foi aprovada por um administrador do BioSchedule.' 
            : 'Verifique seu e-mail e senha e tente novamente.',
          confirmButtonColor: '#2563eb',
          customClass: { popup: 'rounded-[2rem]' }
        });
      }
    } else {
      try {
        // Envia para o backend para criar o usuário
        // O backend deve garantir que 'ativo' seja false por padrão
        await api.post('/usuarios', { 
          nome, 
          email, 
          senha 
        });

        await Swal.fire({
          icon: 'success',
          title: 'Solicitação Enviada!',
          text: 'Seu cadastro foi recebido! Agora, um administrador precisa ativar sua conta para você conseguir logar.',
          confirmButtonColor: '#4f46e5',
          customClass: { popup: 'rounded-[2rem]' }
        });
        
        setIsLogin(true); // Volta para o login após cadastrar
        setNome('');
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Erro no Cadastro',
          text: err.response?.data?.message || 'Não foi possível realizar o cadastro.',
          customClass: { popup: 'rounded-[2rem]' }
        });
      }
    }
  }

  return (
    <div className="min-h-screen flex bg-white font-sans overflow-hidden">
      
      {/* LADO ESQUERDO - DINÂMICO E ANIMADO */}
      <div className={`hidden lg:flex w-1/2 p-12 flex-col justify-between relative overflow-hidden transition-all duration-700 ${isLogin ? 'bg-blue-600' : 'bg-indigo-700'}`}>
        
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-black/10 animate-gradient-slow"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white mb-12 animate-fade-in">
            <ShieldCheck size={40} className="text-white fill-white/10" />
            <h1 className="text-3xl font-black tracking-tighter uppercase">BioSchedule</h1>
          </div>
          
          <div className="mt-20 space-y-6">
            <h2 className="text-6xl font-black text-white leading-[1.1] tracking-tight animate-slide-right">
              {isLogin ? (
                <>Sua clínica, <br/> <span className="text-blue-200">em suas mãos.</span></>
              ) : (
                <>Comece sua <br/> <span className="text-indigo-200">jornada hoje.</span></>
              )}
            </h2>
            <p className="text-white/80 mt-6 text-xl max-w-md font-medium leading-relaxed animate-fade-in delay-300">
              Gerencie agendamentos, pacientes e finanças com a plataforma mais intuitiva do mercado.
            </p>
          </div>
        </div>

        <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-white/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/20 rounded-full blur-[100px] animate-pulse delay-700"></div>
      </div>

      {/* LADO DIREITO - FORMULÁRIO */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-slate-50/50">
        <div className="w-full max-w-md">
          
          <div className="mb-10 text-center lg:text-left animate-slide-up">
            <div className="lg:hidden flex justify-center mb-6">
               <ShieldCheck size={48} className="text-blue-600" />
            </div>
            {/* CORREÇÃO DO GÊNERO AQUI */}
            <h2 className="text-4xl font-black text-slate-800 tracking-tight transition-all">
              {isLogin ? 'Bem-vindo de volta' : 'Criar nova conta'}
            </h2>
            <p className="text-slate-500 mt-2 text-lg font-medium">
              {isLogin ? 'Acesse sua área administrativa.' : 'Junte-se à nossa rede de profissionais.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up delay-100">
            {!isLogin && (
              <div className="group">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest transition-colors group-focus-within:text-indigo-600">Nome Completo</label>
                <div className="relative mt-1">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600">
                    <User size={20} />
                  </div>
                  <input 
                    type="text" required placeholder="Digite seu nome"
                    className="w-full py-4 pr-4 pl-12 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent font-medium text-slate-700 shadow-sm transition-all"
                    value={nome} onChange={e => setNome(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="group">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest transition-colors group-focus-within:text-blue-600">E-mail</label>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" required placeholder="seu@email.com"
                  className="w-full py-4 pr-4 pl-12 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-slate-700 shadow-sm transition-all"
                  value={email} onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="group">
              <div className="flex justify-between items-center ml-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest transition-colors group-focus-within:text-blue-600">Senha</label>
              </div>
              <div className="relative mt-1">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                  <Lock size={20} />
                </div>
                <input 
                  type="password" required placeholder="••••••••"
                  className="w-full py-4 pr-4 pl-12 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-slate-700 shadow-sm transition-all"
                  value={senha} onChange={e => setSenha(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className={`w-full text-white font-bold py-4 rounded-2xl transition-all shadow-lg mt-4 flex items-center justify-center gap-2 group active:scale-[0.98] ${isLogin ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'}`}
            >
              {isLogin ? 'Entrar Agora' : 'Criar minha conta'} 
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <div className="mt-8 text-center animate-fade-in delay-500">
            <p className="text-slate-500 text-sm font-medium">
              {isLogin ? 'Ainda não tem acesso?' : 'Já possui cadastro?'} {' '}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className={`font-bold underline-offset-4 hover:underline transition-all ${isLogin ? 'text-blue-600' : 'text-indigo-600'}`}
              >
                {isLogin ? 'Cadastre-se aqui' : 'Fazer login'}
              </button>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes slideRight {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-gradient-slow {
          background-size: 200% 200%;
          animation: gradientMove 15s ease infinite;
        }
        .animate-slide-right { animation: slideRight 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slide-up { animation: slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fade-in { animation: fadeIn 1s ease-out forwards; }
        .delay-100 { animation-delay: 100ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-500 { animation-delay: 500ms; }
      `}</style>
    </div>
  );
}