import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  ArrowRight,
  CheckCircle,
  Sparkles,
  CalendarDays,
  Filter,
  XCircle,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  Activity,
  AlertTriangle,
  BarChart3
} from 'lucide-react';
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend
} from 'recharts';

// Tipos do retorno da API
interface DashboardData {
  periodo: { inicio: string; fim: string };
  metricas: {
    totalAgendamentos: number;
    concluidos: number;
    cancelados: number;
    faltas: number;
    pendentes: number;
  };
  financeiro: {
    faturamentoReal: number;
    faturamentoEsperado: number;
    perdas: number;
    ticketMedio: number;
    taxaConversao: number;
    taxaCancelamento: number;
  };
  comparativo: {
    faturamentoRealAnterior: number;
    variacaoFaturamento: number;
    totalAgendamentosAnterior: number;
    variacaoAgendamentos: number;
  };
  topServicos: Array<{
    nome: string;
    quantidade: number;
    faturamento: number;
  }>;
  grafico: Array<{
    label: string;
    atendimentos: number;
    faturamento: number;
  }>;
  proximosAtendimentos: Array<{
    id: string;
    hora: string;
    data: string;
    paciente: string;
    servico: string;
    valor: number;
    status: string;
  }>;
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getIntervalo(periodo: string, dataInicio?: string, dataFim?: string) {
  const agora = new Date();
  let inicio = new Date();
  let fim = new Date();

  if (periodo === 'hoje') {
    inicio = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    fim = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
  } else if (periodo === 'semana') {
    inicio = new Date(agora);
    inicio.setDate(agora.getDate() - agora.getDay());
    fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);
  } else if (periodo === 'mes') {
    inicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0);
  } else if (periodo === 'custom' && dataInicio && dataFim) {
    inicio = new Date(dataInicio + 'T00:00:00');
    fim = new Date(dataFim + 'T00:00:00');
  }

  return { inicio: formatarDataISO(inicio), fim: formatarDataISO(fim) };
}

// Componente Badge de variação
function VariacaoBadge({ valor }: { valor: number }) {
  if (valor === 0) return null;
  const positivo = valor > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${
      positivo ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
    }`}>
      {positivo ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
      {positivo ? '+' : ''}{valor.toFixed(1)}%
    </span>
  );
}

// Barra de progresso para taxas
function ProgressBar({ valor, cor }: { valor: number; cor: string }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-1000 ease-out ${cor}`}
        style={{ width: `${Math.min(valor, 100)}%` }}
      />
    </div>
  );
}

export function Dashboard() {
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [usuarioNome, setUsuarioNome] = useState('Profissional');
  const [periodo, setPeriodo] = useState<'hoje' | 'semana' | 'mes' | 'custom'>('mes');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Carregar nome do usuário
  useEffect(() => {
    const usuarioSalvo = localStorage.getItem('@BioSchedule:user');
    if (usuarioSalvo) {
      const user = JSON.parse(usuarioSalvo);
      const primeiroNome = user.nome?.split(' ')[0] || 'Profissional';
      if (user.role === 'ADMIN' || user.role === 'PROFISSIONAL') {
        const ultimaLetra = primeiroNome.slice(-1).toLowerCase();
        const prefixo = ultimaLetra === 'a' ? 'Dra.' : 'Dr.';
        setUsuarioNome(`${prefixo} ${primeiroNome}`);
      } else {
        setUsuarioNome(primeiroNome);
      }
    }
  }, []);

  // Buscar dados do dashboard
  useEffect(() => {
    async function fetchDashboard() {
      try {
        setCarregando(true);
        const { inicio, fim } = getIntervalo(periodo, dataInicio, dataFim);
        const res = await api.get('/dashboard/resumo-periodo', {
          params: { inicio, fim },
        });
        setDados(res.data);
      } catch (error) {
        console.error('Erro ao carregar dashboard:', error);
      } finally {
        setCarregando(false);
      }
    }

    if (periodo !== 'custom' || (dataInicio && dataFim)) {
      fetchDashboard();
    }
  }, [periodo, dataInicio, dataFim]);

  if (carregando || !dados) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-blue-600">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
        <p className="font-bold animate-pulse">Carregando indicadores...</p>
      </div>
    );
  }

  const { metricas, financeiro, comparativo, topServicos, grafico, proximosAtendimentos } = dados;

  // Maior faturamento de serviço (para barra proporcional)
  const maxFatServico = topServicos.length > 0 ? topServicos[0].faturamento : 1;

  return (
    <div className="space-y-8 pb-10 max-w-7xl mx-auto">

      {/* =============== HEADER COM FILTRO =============== */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-[2.5rem] p-10 overflow-hidden shadow-2xl shadow-blue-600/20 animate-slide-up">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-blue-400 opacity-20 rounded-full blur-2xl"></div>

        <div className="relative z-10 text-white flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 opacity-80 font-medium tracking-wider uppercase text-sm">
              <Sparkles size={16} className="animate-pulse" /> Painel Financeiro
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">
              Olá, {usuarioNome}! <span className="inline-block animate-wave origin-bottom-right">👋</span>
            </h1>
            <p className="text-blue-100 text-lg max-w-xl font-medium">
              Acompanhe o desempenho financeiro da sua clínica em tempo real.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-3xl border border-white/20 flex gap-1">
            {(['hoje', 'semana', 'mes', 'custom'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriodo(p)}
                className={`px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
                  periodo === p ? 'bg-white text-blue-700 shadow-xl scale-105' : 'text-white hover:bg-white/10'
                }`}
              >
                {p === 'custom' ? <Filter size={16} /> : p === 'mes' ? 'mês' : p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* FILTRO PERSONALIZADO */}
      {periodo === 'custom' && (
        <div className="bg-white p-6 rounded-[2rem] border border-blue-100 shadow-sm flex flex-wrap gap-4 animate-slide-up">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Início</label>
            <input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Fim</label>
            <input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-slate-700" />
          </div>
        </div>
      )}

      {/* =============== 4 CARDS FINANCEIROS =============== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

        {/* Card 1: Faturamento Real */}
        <div className="bg-gradient-to-br from-emerald-500 to-teal-700 p-7 rounded-[2rem] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up delay-100 text-white relative overflow-hidden group">
          <CheckCircle size={100} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <DollarSign size={24} />
              </div>
              <VariacaoBadge valor={comparativo.variacaoFaturamento} />
            </div>
            <p className="text-emerald-200 font-bold uppercase tracking-wider text-[11px] mb-1">Faturamento Real</p>
            <h2 className="text-2xl font-black tracking-tight">{formatarMoeda(financeiro.faturamentoReal)}</h2>
            <p className="text-emerald-200/70 text-xs mt-1 font-medium">{metricas.concluidos} concluídos</p>
          </div>
        </div>

        {/* Card 2: Faturamento Esperado */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 p-7 rounded-[2rem] shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up delay-200 text-white relative overflow-hidden group">
          <TrendingUp size={100} className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <TrendingUp size={24} />
              </div>
              <span className="text-[11px] font-bold bg-white/20 px-2 py-1 rounded-lg">{metricas.pendentes} pendentes</span>
            </div>
            <p className="text-blue-200 font-bold uppercase tracking-wider text-[11px] mb-1">Faturamento Esperado</p>
            <h2 className="text-2xl font-black tracking-tight">{formatarMoeda(financeiro.faturamentoEsperado)}</h2>
            <p className="text-blue-200/70 text-xs mt-1 font-medium">{metricas.totalAgendamentos} agendamentos</p>
          </div>
        </div>

        {/* Card 3: Ticket Médio */}
        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up delay-300 relative overflow-hidden group">
          <Target size={100} className="absolute -right-4 -bottom-4 text-slate-50 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <Target size={24} />
              </div>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mb-1">Ticket Médio</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{formatarMoeda(financeiro.ticketMedio)}</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">por atendimento</p>
          </div>
        </div>

        {/* Card 4: Perdas */}
        <div className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up delay-400 relative overflow-hidden group">
          <XCircle size={100} className="absolute -right-4 -bottom-4 text-slate-50 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-rose-50 text-rose-500 rounded-xl group-hover:bg-rose-500 group-hover:text-white transition-colors">
                <TrendingDown size={24} />
              </div>
              {financeiro.perdas > 0 && (
                <span className="text-[11px] font-bold bg-rose-100 text-rose-600 px-2 py-1 rounded-lg flex items-center gap-1">
                  <AlertTriangle size={10} /> atenção
                </span>
              )}
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[11px] mb-1">Perdas</p>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{formatarMoeda(financeiro.perdas)}</h2>
            <p className="text-slate-400 text-xs mt-1 font-medium">{metricas.cancelados + metricas.faltas} faltas/canc.</p>
          </div>
        </div>
      </div>

      {/* =============== PAINEL DE SAÚDE DO NEGÓCIO =============== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-slide-up delay-400">
        {/* Taxa de Conversão */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                <Activity size={20} />
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Taxa de Conversão</p>
                <p className="text-xs text-slate-500 font-medium">Agendados → Concluídos</p>
              </div>
            </div>
            <span className={`text-2xl font-black ${
              financeiro.taxaConversao >= 80 ? 'text-emerald-600' :
              financeiro.taxaConversao >= 60 ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {financeiro.taxaConversao}%
            </span>
          </div>
          <ProgressBar
            valor={financeiro.taxaConversao}
            cor={
              financeiro.taxaConversao >= 80 ? 'bg-emerald-500' :
              financeiro.taxaConversao >= 60 ? 'bg-amber-500' : 'bg-rose-500'
            }
          />
        </div>

        {/* Taxa de Cancelamento */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 text-rose-500 rounded-xl">
                <XCircle size={20} />
              </div>
              <div>
                <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Taxa de Cancelamento</p>
                <p className="text-xs text-slate-500 font-medium">Faltas + Cancelamentos</p>
              </div>
            </div>
            <span className={`text-2xl font-black ${
              financeiro.taxaCancelamento <= 10 ? 'text-emerald-600' :
              financeiro.taxaCancelamento <= 20 ? 'text-amber-500' : 'text-rose-500'
            }`}>
              {financeiro.taxaCancelamento}%
            </span>
          </div>
          <ProgressBar
            valor={financeiro.taxaCancelamento}
            cor={
              financeiro.taxaCancelamento <= 10 ? 'bg-emerald-500' :
              financeiro.taxaCancelamento <= 20 ? 'bg-amber-500' : 'bg-rose-500'
            }
          />
        </div>
      </div>

      {/* =============== GRÁFICO + RANKING =============== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* GRÁFICO DUPLO */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-slide-up delay-500">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <BarChart3 className="text-blue-600" /> Fluxo do Período
          </h3>
          <div className="w-full h-80 min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <ComposedChart data={grafico} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                  dy={10}
                />
                <YAxis
                  yAxisId="left"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  allowDecimals={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  tickFormatter={(v: number) => `R$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '1rem',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    fontSize: '13px',
                  }}
                  formatter={(value, name) => {
                    if (name === 'Faturamento') return [formatarMoeda(Number(value)), name];
                    return [String(value), name];
                  }}
                />
                <Legend
                  wrapperStyle={{ fontSize: '12px', fontWeight: 600 }}
                />
                <Bar
                  yAxisId="left"
                  dataKey="atendimentos"
                  name="Atendimentos"
                  fill="#2563eb"
                  radius={[6, 6, 6, 6]}
                  barSize={32}
                  animationDuration={1200}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="faturamento"
                  name="Faturamento"
                  stroke="#10b981"
                  strokeWidth={3}
                  dot={{ fill: '#10b981', r: 4, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
                  animationDuration={1500}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* RANKING TOP SERVIÇOS */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-slide-up delay-500">
          <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Trophy className="text-amber-500" /> Top Serviços
          </h3>

          {topServicos.length > 0 ? (
            <div className="space-y-5">
              {topServicos.map((servico, index) => (
                <div key={servico.nome} className="group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black text-white ${
                        index === 0 ? 'bg-amber-500' :
                        index === 1 ? 'bg-slate-400' :
                        index === 2 ? 'bg-amber-700' : 'bg-slate-300'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-700 text-sm truncate max-w-[140px]">{servico.nome}</p>
                        <p className="text-[11px] text-slate-400 font-medium">{servico.quantidade}x realizados</p>
                      </div>
                    </div>
                    <span className="font-black text-sm text-emerald-600">{formatarMoeda(servico.faturamento)}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                      style={{ width: `${(servico.faturamento / maxFatServico) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-60 py-10">
              <Trophy size={48} className="mb-4 text-amber-200" />
              <p className="font-medium text-center text-sm">Nenhum serviço<br/>concluído no período</p>
            </div>
          )}
        </div>
      </div>

      {/* =============== PRÓXIMOS ATENDIMENTOS =============== */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 animate-slide-up delay-500">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Clock className="text-blue-600" /> Próximos Atendimentos
          </h3>
          <Link to="/agenda" className="text-blue-600 font-bold text-sm flex items-center gap-1 hover:text-blue-700 transition-colors bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100">
            Ver Agenda <ArrowRight size={16} />
          </Link>
        </div>

        {proximosAtendimentos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {proximosAtendimentos.map((ag) => (
              <div key={ag.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-blue-300 hover:shadow-md transition-all group cursor-default">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-blue-600 text-lg">{ag.hora}</span>
                    <span className="text-slate-400 text-xs font-medium">{ag.data}</span>
                  </div>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2.5 py-1 rounded-md uppercase tracking-wider">
                    {ag.servico}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="font-bold text-slate-700 truncate group-hover:text-blue-600 transition-colors">
                    {ag.paciente}
                  </p>
                  <span className="text-xs font-bold text-emerald-600">{formatarMoeda(ag.valor)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-slate-400 opacity-60 py-10">
            <CalendarDays size={48} className="mb-4 text-blue-300" />
            <p className="font-medium text-center text-sm">Nenhum atendimento<br/>pendente no período!</p>
          </div>
        )}
      </div>

      {/* ESTILOS CUSTOMIZADOS */}
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