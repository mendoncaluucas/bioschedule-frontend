import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  CheckCircle,
  Sparkles
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

export function Dashboard() {
  const [agendamentosHoje, setAgendamentosHoje] = useState<any[]>([]);
  const [faturacaoHoje, setFaturacaoHoje] = useState(0);
  const [faturamentoMes, setFaturamentoMes] = useState(0); 
  const [dadosGrafico, setDadosGrafico] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Estado que vai guardar o nome final formatado
  const [usuarioNome, setUsuarioNome] = useState('Profissional');

  useEffect(() => {
    async function carregarDashboard() {
      try {
        setCarregando(true);

        // --- BUSCA O USUÁRIO E DEFINE O TÍTULO PELA ROLE ---
        const usuarioSalvo = localStorage.getItem('@BioSchedule:user');
        if (usuarioSalvo) {
          const dados = JSON.parse(usuarioSalvo);
          const primeiroNome = dados.nome?.split(' ')[0] || 'Profissional';
          
          if (dados.role === 'ADMIN' || dados.role === 'PROFISSIONAL') {
            const ultimaLetra = primeiroNome.slice(-1).toLowerCase();
            const prefixo = ultimaLetra === 'a' ? 'Dra.' : 'Dr.';
            setUsuarioNome(`${prefixo} ${primeiroNome}`);
          } else {
            setUsuarioNome(primeiroNome);
          }
        }

        // --- BUSCA OS DADOS DA AGENDA ---
        const resAgenda = await api.get('/agendamento');

        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();

        let previsaoHoje = 0;
        let ganhoMesReal = 0;

        const hojeAgendamentos = resAgenda.data.filter((ag: any) => {
          if (!ag.data_inicio) return false;
          
          const dataAg = new Date(ag.data_inicio);

          // Cálculo do faturamento mensal (apenas CONCLUIDOS)
          if (dataAg.getMonth() === mesAtual && dataAg.getFullYear() === anoAtual) {
            if (ag.status === 'CONCLUIDO') {
              ganhoMesReal += ag.servico?.valor ? Number(ag.servico.valor) : 0;
            }
          }

          // Verificação se o agendamento é hoje
          const isHoje = dataAg.getDate() === hoje.getDate() && 
                         dataAg.getMonth() === hoje.getMonth() && 
                         dataAg.getFullYear() === hoje.getFullYear();

          // Cálculo da previsão do dia (exclui CANCELADOS e FALTAS)
          if (isHoje && ag.status !== 'CANCELADO' && ag.status !== 'FALTOU') {
            previsaoHoje += ag.servico?.valor ? Number(ag.servico.valor) : 0;
          }

          return isHoje && ag.status !== 'CANCELADO';
        });

        // Ordena a agenda do dia por horário
        hojeAgendamentos.sort((a: any, b: any) => 
          new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()
        );

        setAgendamentosHoje(hojeAgendamentos);
        setFaturacaoHoje(previsaoHoje);
        setFaturamentoMes(ganhoMesReal);

        // --- LÓGICA DO GRÁFICO DA SEMANA ---
        const diasSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const contadoresSemana = { 'Seg': 0, 'Ter': 0, 'Qua': 0, 'Qui': 0, 'Sex': 0, 'Sáb': 0 };

        const agora = new Date();
        const inicioSemana = new Date(agora);
        inicioSemana.setDate(agora.getDate() - agora.getDay());
        inicioSemana.setHours(0, 0, 0, 0);

        const fimSemana = new Date(inicioSemana);
        fimSemana.setDate(inicioSemana.getDate() + 6);
        fimSemana.setHours(23, 59, 59, 999);

        resAgenda.data.forEach((ag: any) => {
          if (ag.data_inicio && ag.status !== 'CANCELADO') {
            const dataAg = new Date(ag.data_inicio);
            if (dataAg >= inicioSemana && dataAg <= fimSemana) {
              const nomeDia = diasSemanaNomes[dataAg.getDay()];
              if (contadoresSemana[nomeDia as keyof typeof contadoresSemana] !== undefined) {
                contadoresSemana[nomeDia as keyof typeof contadoresSemana]++;
              }
            }
          }
        });

        const dadosReaisGrafico = Object.keys(contadoresSemana).map(dia => ({
          nome: dia,
          atendimentos: contadoresSemana[dia as keyof typeof contadoresSemana]
        }));

        setDadosGrafico(dadosReaisGrafico);

      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setCarregando(false);
      }
    }

    carregarDashboard();
  }, []);

  if (carregando) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-blue-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
        <p className="font-bold animate-pulse">Calculando faturamento...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 max-w-6xl mx-auto">
      
      {/* HEADER DINÂMICO */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl shadow-blue-600/20 animate-slide-up">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-400 opacity-20 rounded-full blur-2xl"></div>
        
        <div className="relative z-10 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-80 font-medium tracking-wider uppercase text-sm">
            <Sparkles size={16} className="animate-pulse" /> Visão Geral da Clínica
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
            Olá, {usuarioNome}! <span className="inline-block animate-wave origin-bottom-right">👋</span>
          </h1>
          <p className="text-blue-100 text-lg max-w-xl font-medium">
            Aqui está o resumo financeiro e a sua agenda para hoje.
          </p>
        </div>
      </div>

      {/* CARDS INDICADORES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up delay-100 relative overflow-hidden group flex items-center gap-6">
          <div className="absolute -right-6 -top-6 bg-slate-50 w-32 h-32 rounded-full transition-transform group-hover:scale-150 duration-500 z-0"></div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl relative z-10 shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <CalendarIcon size={32} />
          </div>
          <div className="relative z-10">
            <p className="text-slate-400 font-bold uppercase tracking-wider text-xs mb-1">Agendamentos Hoje</p>
            <h2 className="text-4xl font-black text-slate-800 tracking-tight">{agendamentosHoje.length}</h2>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-8 rounded-[2rem] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up delay-200 flex items-center gap-6 text-white relative overflow-hidden group">
          <TrendingUp size={120} className="absolute -right-6 -bottom-6 opacity-10 transition-transform group-hover:scale-110 group-hover:-rotate-12 duration-500" />
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm relative z-10 shadow-inner">
            <DollarSign size={32} />
          </div>
          <div className="relative z-10">
            <p className="text-blue-200 font-bold uppercase tracking-wider text-xs mb-1">Previsão Hoje</p>
            <h2 className="text-3xl font-black tracking-tight">
              R$ {faturacaoHoje.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-8 rounded-[2rem] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up delay-300 flex items-center gap-6 text-white relative overflow-hidden group">
          <CheckCircle size={120} className="absolute -right-6 -bottom-6 opacity-10 transition-transform group-hover:scale-110 group-hover:rotate-12 duration-500" />
          <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm relative z-10 shadow-inner">
            <CheckCircle size={32} />
          </div>
          <div className="relative z-10">
            <p className="text-emerald-200 font-bold uppercase tracking-wider text-xs mb-1">Mês (Concluído)</p>
            <h2 className="text-3xl font-black tracking-tight">
              R$ {faturamentoMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h2>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* GRÁFICO DA SEMANA */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-slide-up delay-400">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <TrendingUp className="text-blue-600" /> Atendimentos na Semana Atual
          </h3>
          <div className="w-full h-80 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={dadosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="nome" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#94a3b8', fontSize: 12 }} 
                  allowDecimals={false} 
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }} 
                  contentStyle={{ 
                    borderRadius: '1rem', 
                    border: '1px solid #e2e8f0', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                  }} 
                />
                <Bar 
                  dataKey="atendimentos" 
                  name="Consultas"
                  fill="#2563eb" 
                  radius={[8, 8, 8, 8]} 
                  barSize={40} 
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AGENDA DE HOJE MINIATURA */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-[400px] animate-slide-up delay-500">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Clock className="text-blue-600" /> Hoje
            </h3>
            <Link to="/agenda" className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
              Agenda <ArrowRight size={16} />
            </Link>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
            {agendamentosHoje.length > 0 ? (
              agendamentosHoje.map((ag) => (
                <div key={ag.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group cursor-default">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-black text-blue-600 text-lg">
                      {new Date(ag.data_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {ag.servico?.nome || 'Procedimento'}
                    </span>
                  </div>
                  <p className="font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                    {ag.paciente?.nome}
                  </p>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60">
                <CalendarIcon size={48} className="mb-4 text-blue-300" />
                <p className="font-medium text-center text-sm">A agenda de hoje<br/>está livre!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ESTILOS CUSTOMIZADOS (CSS) */}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-20deg); }
          50% { transform: rotate(10deg); }
          75% { transform: rotate(-15deg); }
        }
        .animate-wave { animation: wave 2.5s infinite; transform-origin: 70% 70%; display: inline-block; }
        @keyframes slideUpFade {
          0% { opacity: 0; transform: translateY(30px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .delay-100 { animation-delay: 100ms; }
        .delay-200 { animation-delay: 200ms; }
        .delay-300 { animation-delay: 300ms; }
        .delay-400 { animation-delay: 400ms; }
        .delay-500 { animation-delay: 500ms; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
      `}</style>
    </div>
  );
}