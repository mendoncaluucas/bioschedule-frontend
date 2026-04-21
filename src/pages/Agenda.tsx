import { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import { 
  Calendar, Clock, User, Plus, Check, X, Play, CheckCircle, 
  CalendarDays, AlertCircle, ChevronLeft, ChevronRight, ChevronDown, 
  Sparkles, Search, CalendarSearch, Stethoscope, Trash2 // ✨ Ícone Trash2 adicionado aqui!
} from 'lucide-react';
import Swal from 'sweetalert2';

interface Agendamento {
  id: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  profissionalId: string;
  paciente: { nome: string };
  servico: { nome: string; valor: number };
  profissional?: { nome: string };
}

interface Paciente { id: string; nome: string; }
interface Servico { id: string; nome: string; duracao_minutos: number; }

interface ConfiguracaoAgenda {
  dia_semana: number;
  ativo: boolean;
  abertura: string;
  fechamento: string;
  almoco_inicio: string;
  almoco_fim: string;
}

export function Agenda() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [configs, setConfigs] = useState<ConfiguracaoAgenda[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [dataSelecionada, setDataSelecionada] = useState('');
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    pacienteId: '',
    servicoId: '',
    horaSelecionada: '' 
  });

  const [selecaoAberta, setSelecaoAberta] = useState<'paciente' | 'servico' | 'data_filtro' | null>(null);
  const [buscaSelecao, setBuscaSelecao] = useState('');

  // PEGANDO O USUÁRIO LOGADO NO TOPO DO COMPONENTE
  const usuarioSalvo = localStorage.getItem('@BioSchedule:user');
  const usuarioLogado = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

  const hoje = new Date();
  const formatarDataInput = (data: Date) => {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  };
  const [dataFiltroPrincipal, setDataFiltroPrincipal] = useState(formatarDataInput(hoje));

  const dataMinima = formatarDataInput(hoje);
  const hojeMeiaNoite = new Date();
  hojeMeiaNoite.setHours(0, 0, 0, 0); 
  const [mesReferencia, setMesReferencia] = useState(new Date(hojeMeiaNoite.getFullYear(), hojeMeiaNoite.getMonth(), 1));
  
  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const mudarMes = (offset: number) => {
    setMesReferencia(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + offset, 1));
  };

  const isMesAtual = mesReferencia.getFullYear() === hojeMeiaNoite.getFullYear() && mesReferencia.getMonth() === hojeMeiaNoite.getMonth();

  const diasGrid = useMemo(() => {
    const ano = mesReferencia.getFullYear();
    const mes = mesReferencia.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    const grid = [];
    for (let i = 0; i < primeiroDia; i++) grid.push(null); 
    for (let i = 1; i <= totalDias; i++) grid.push(new Date(ano, mes, i));
    return grid;
  }, [mesReferencia]);

  const [mesReferenciaFiltro, setMesReferenciaFiltro] = useState(new Date(hojeMeiaNoite.getFullYear(), hojeMeiaNoite.getMonth(), 1));
  
  const mudarMesFiltro = (offset: number) => {
    setMesReferenciaFiltro(new Date(mesReferenciaFiltro.getFullYear(), mesReferenciaFiltro.getMonth() + offset, 1));
  };

  const diasGridFiltro = useMemo(() => {
    const ano = mesReferenciaFiltro.getFullYear();
    const mes = mesReferenciaFiltro.getMonth();
    const primeiroDia = new Date(ano, mes, 1).getDay();
    const totalDias = new Date(ano, mes + 1, 0).getDate();

    const grid = [];
    for (let i = 0; i < primeiroDia; i++) grid.push(null); 
    for (let i = 1; i <= totalDias; i++) grid.push(new Date(ano, mes, i));
    return grid;
  }, [mesReferenciaFiltro]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [resAgenda, resPacientes, resServicos, resConfigs] = await Promise.all([
        api.get('/agendamento'),
        api.get('/paciente'), 
        api.get('/servicos'),
        api.get('/configuracao-agenda') 
      ]);

      let agendaFiltrada = resAgenda.data;
      if (usuarioLogado?.role !== 'ADMIN') {
        agendaFiltrada = agendaFiltrada.filter((ag: any) => ag.profissionalId === usuarioLogado.id);
      }

      setAgendamentos(agendaFiltrada);
      setPacientes(resPacientes.data);
      setServicos(resServicos.data);
      setConfigs(resConfigs.data);
    } catch (err) {
      console.error("Erro ao carregar dados", err);
    }
  }

  useEffect(() => {
    if (!dataSelecionada || !formData.servicoId || configs.length === 0) {
      setHorariosDisponiveis([]);
      return;
    }

    const servico = servicos.find(s => s.id === formData.servicoId);
    const dateObj = new Date(dataSelecionada + 'T12:00:00');
    const config = configs.find(c => c.dia_semana === dateObj.getDay());

    if (!servico || !config) return;

    const paraMinutos = (str: string) => {
      const [h, m] = str.split(':').map(Number);
      return h * 60 + m;
    };

    const duracao = servico.duracao_minutos;
    const TEMPO_DE_SOBRA = 10;
    const inicioExpediente = paraMinutos(config.abertura);
    const fimExpediente = paraMinutos(config.fechamento);
    const almocoInicio = paraMinutos(config.almoco_inicio);
    const almocoFim = paraMinutos(config.almoco_fim);

    const agendamentosDoDia = agendamentos.filter(ag => {
      if (ag.status === 'CANCELADO' || ag.status === 'FALTOU') return false;
      return ag.data_inicio.split('T')[0] === dataSelecionada;
    });

    const slotsGerados: string[] = [];
    const agora = new Date();
    const horaAtualMinutos = agora.getHours() * 60 + agora.getMinutes();

    for (let min = inicioExpediente; min + duracao <= fimExpediente; min += 10) {
      if (dataSelecionada === dataMinima && min <= horaAtualMinutos) continue;
      if (min + duracao > almocoInicio && min < almocoFim) continue;

      const inicioSlot = min;
      const fimSlot = min + duracao;

      const temConflito = agendamentosDoDia.some(ag => {
        const dIni = new Date(ag.data_inicio);
        const dFim = new Date(ag.data_fim);
        const agInicio = dIni.getHours() * 60 + dIni.getMinutes();
        const agFimComSobra = (dFim.getHours() * 60 + dFim.getMinutes()) + TEMPO_DE_SOBRA;

        return (inicioSlot < agFimComSobra && fimSlot > agInicio);
      });

      if (!temConflito) {
        const h = String(Math.floor(min / 60)).padStart(2, '0');
        const m = String(min % 60).padStart(2, '0');
        slotsGerados.push(`${h}:${m}`);
      }
    }

    setHorariosDisponiveis(slotsGerados);
    setFormData(prev => ({ ...prev, horaSelecionada: '' }));

  }, [dataSelecionada, formData.servicoId, agendamentos, servicos, configs, dataMinima]);


  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    try {
      const servicoSelecionado = servicos.find(s => s.id === formData.servicoId);
      const duracao = servicoSelecionado?.duracao_minutos || 60;

      const dataInicioObj = new Date(`${dataSelecionada}T${formData.horaSelecionada}:00`);
      const dataFimObj = new Date(dataInicioObj.getTime() + duracao * 60000);

      await api.post('/agendamento', {
        pacienteId: formData.pacienteId,
        servicoId: formData.servicoId,
        profissionalId: usuarioLogado?.id, 
        data_inicio: dataInicioObj.toISOString(),
        data_fim: dataFimObj.toISOString() 
      });
      
      Swal.fire({ icon: 'success', title: 'Horário Agendado!', timer: 2000, showConfirmButton: false });
      setIsModalOpen(false);
      setDataSelecionada('');
      
      setDataFiltroPrincipal(dataSelecionada);
      
      setFormData({ pacienteId: '', servicoId: '', horaSelecionada: '' });
      carregarDados();
    } catch (error: any) {
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível agendar.' });
    }
  }

  async function alterarStatus(id: string, novoStatus: string) {
    try {
      await api.patch(`/agendamento/${id}`, { status: novoStatus });
      carregarDados(); 
    } catch (err) {
      Swal.fire('Erro', 'Não foi possível alterar.', 'error');
    }
  }

  // ✨ NOVA FUNÇÃO DE DELETAR (Excluir do Banco)
  const handleRemoverAgendamento = async (id: string) => {
    const confirmacao = await Swal.fire({
      title: 'Excluir agendamento?',
      text: "Isso apagará o agendamento e liberará o horário na agenda. Essa ação não pode ser desfeita.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sim, excluir!',
      cancelButtonText: 'Cancelar',
      customClass: { popup: 'rounded-[2rem]' }
    });

    if (confirmacao.isConfirmed) {
      try {
        await api.delete(`/agendamento/${id}`);
        Swal.fire({ icon: 'success', title: 'Excluído!', text: 'Agendamento removido com sucesso.', timer: 2000, showConfirmButton: false });
        carregarDados(); // Recarrega a tela na hora para o horário voltar a ficar livre
      } catch (error) {
        console.error(error);
        Swal.fire('Erro', 'Não foi possível excluir o agendamento.', 'error');
      }
    }
  };

  const mudarDiaFiltro = (dias: number) => {
    const dataAtual = new Date(dataFiltroPrincipal + 'T12:00:00');
    dataAtual.setDate(dataAtual.getDate() + dias);
    setDataFiltroPrincipal(formatarDataInput(dataAtual));
  };

  const agendamentosFiltrados = agendamentos
    .filter(ag => ag.data_inicio.split('T')[0] === dataFiltroPrincipal)
    .sort((a, b) => new Date(a.data_inicio).getTime() - new Date(b.data_inicio).getTime()); 

  const dataFiltroObj = new Date(dataFiltroPrincipal + 'T12:00:00');
  const nomeDiaSemana = diasSemanaNomes[dataFiltroObj.getDay()];
  const textoDataFiltro = dataFiltroPrincipal === formatarDataInput(hoje) 
    ? 'Hoje' 
    : `${nomeDiaSemana}, ${dataFiltroObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}`;

  const abrirCalendarioFiltro = () => {
    const ano = parseInt(dataFiltroPrincipal.split('-')[0]);
    const mes = parseInt(dataFiltroPrincipal.split('-')[1]) - 1;
    setMesReferenciaFiltro(new Date(ano, mes, 1));
    setSelecaoAberta('data_filtro');
  };

  const statusConfig: any = {
    AGENDADO: { cor: 'bg-amber-100 text-amber-700 border-amber-200', icone: <Clock size={16} /> },
    CONFIRMADO: { cor: 'bg-blue-100 text-blue-700 border-blue-200', icone: <Check size={16} /> },
    CONCLUIDO: { cor: 'bg-emerald-100 text-emerald-700 border-emerald-200', icone: <CheckCircle size={16} /> },
    FALTOU: { cor: 'bg-rose-100 text-rose-700 border-rose-200', icone: <X size={16} /> },
    CANCELADO: { cor: 'bg-slate-100 text-slate-700 border-slate-200', icone: <X size={16} /> }
  };

  const isFormValido = formData.pacienteId && formData.servicoId && dataSelecionada && formData.horaSelecionada;
  const pacientesFiltrados = pacientes.filter(p => p.nome.toLowerCase().includes(buscaSelecao.toLowerCase()));
  const servicosFiltrados = servicos.filter(s => s.nome.toLowerCase().includes(buscaSelecao.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto pb-10 relative">
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Calendar className="text-blue-600" size={36} /> Agenda
          </h1>
          <p className="text-slate-500 font-medium mt-2">Gestão de horários e atendimento.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 w-full md:w-auto justify-center"
        >
          <Plus size={20} /> Novo Agendamento
        </button>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 animate-slide-up delay-100">
        <div className="flex items-center gap-2">
          <CalendarSearch className="text-slate-400 mr-2" size={24} />
          <h2 className="font-bold text-slate-700 text-lg">Visualizando:</h2>
        </div>
        
        <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto justify-between sm:justify-center">
          <button onClick={() => mudarDiaFiltro(-1)} className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm">
            <ChevronLeft size={20} className="text-slate-600" />
          </button>
          
          <div 
            onClick={abrirCalendarioFiltro}
            className="flex items-center gap-2 cursor-pointer hover:bg-white p-2 rounded-lg transition-colors group"
          >
            <span className="font-bold text-blue-600 min-w-[140px] text-center transition-colors group-hover:text-blue-700">
              {textoDataFiltro}
            </span>
            <ChevronDown size={16} className="text-blue-600 group-hover:text-blue-700" />
          </div>

          <button onClick={() => mudarDiaFiltro(1)} className="p-2 hover:bg-white rounded-lg transition-colors shadow-sm">
            <ChevronRight size={20} className="text-slate-600" />
          </button>
        </div>

        <button 
          onClick={() => setDataFiltroPrincipal(formatarDataInput(hoje))}
          className="font-bold text-sm text-slate-500 hover:text-blue-600 transition-colors px-4 py-2 bg-slate-50 rounded-xl hover:bg-blue-50 hidden sm:block"
        >
          Ir para Hoje
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {agendamentosFiltrados.map((agendamento, index) => {
          const config = statusConfig[agendamento.status] || statusConfig['AGENDADO'];
          const data = new Date(agendamento.data_inicio);
          const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          const dataFormatada = data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

          const delayClass = `delay-${Math.min((index + 2) * 100, 500)}`;

          return (
            <div key={agendamento.id} className={`bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-md transition-all flex flex-col h-full animate-slide-up ${delayClass}`}>
              <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider border ${config.cor}`}>
                  {config.icone} {agendamento.status}
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-slate-800">{hora}</span>
                  <p className="text-sm font-medium text-slate-400">{dataFormatada}</p>
                </div>
              </div>

              <div className="space-y-3 mb-6 flex-1">
                <div className="flex items-center gap-3 text-slate-700 font-medium">
                  <User size={18} className="text-slate-400 shrink-0" />
                  <span className="truncate">{agendamento.paciente?.nome}</span>
                </div>
                <div className="flex items-center gap-3 text-slate-700 font-medium">
                  <Play size={18} className="text-slate-400 shrink-0" />
                  <span className="truncate">{agendamento.servico?.nome}</span>
                </div>
                
                {usuarioLogado?.role === 'ADMIN' && agendamento.profissional && (
                  <div className="flex items-center gap-3 text-indigo-500 font-medium text-sm mt-1">
                    <Stethoscope size={18} className="text-indigo-300 shrink-0" />
                    <span className="truncate">Dr(a). {agendamento.profissional.nome.split(' ')[0]}</span>
                  </div>
                )}
              </div>

              {/* ✨ BARRA DE AÇÕES (Inclui o botão de excluir) */}
              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 mt-auto">
                {agendamento.status === 'AGENDADO' && (
                  <button onClick={() => alterarStatus(agendamento.id, 'CONFIRMADO')} className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-xl text-sm font-bold hover:bg-blue-100 transition-colors">
                    Confirmar
                  </button>
                )}
                {agendamento.status === 'CONFIRMADO' && (
                  <button onClick={() => alterarStatus(agendamento.id, 'CONCLUIDO')} className="flex-1 bg-emerald-50 text-emerald-600 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors">
                    Concluir
                  </button>
                )}
                {(agendamento.status === 'AGENDADO' || agendamento.status === 'CONFIRMADO') && (
                  <button onClick={() => alterarStatus(agendamento.id, 'FALTOU')} className="flex-1 bg-rose-50 text-rose-600 py-2.5 rounded-xl text-sm font-bold hover:bg-rose-100 transition-colors">
                    Faltou
                  </button>
                )}

                {/* ✨ BOTÃO DE LIXEIRA AQUI */}
                <button 
                  onClick={() => handleRemoverAgendamento(agendamento.id)} 
                  className="p-2.5 text-rose-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-all border border-transparent hover:border-rose-100 shrink-0"
                  title="Excluir Agendamento"
                >
                  <Trash2 size={20} />
                </button>

              </div>
            </div>
          );
        })}

        {agendamentosFiltrados.length === 0 && (
          <div className="col-span-full text-center py-20 text-slate-400 animate-slide-up delay-200">
            <CalendarDays size={56} className="mx-auto mb-4 opacity-20 text-blue-600" />
            <p className="text-xl font-bold text-slate-600">Agenda Livre!</p>
            <p className="font-medium mt-1">Nenhum agendamento para {textoDataFiltro.toLowerCase()}.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-40">
          
          {selecaoAberta && (
            <div className="fixed inset-0 z-50" onClick={() => setSelecaoAberta(null)}></div>
          )}

          <div className="bg-white rounded-[2rem] p-6 w-full max-w-3xl shadow-2xl max-h-[95vh] overflow-y-auto scale-in relative z-40 custom-scrollbar">
            
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <CalendarDays className="text-blue-600" /> Agendar Horário
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 p-2 bg-slate-50 rounded-full">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Paciente</label>
                  <div 
                    onClick={() => { setBuscaSelecao(''); setSelecaoAberta('paciente'); }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <User size={16} className={formData.pacienteId ? 'text-blue-600' : 'text-slate-400'} />
                      <span className={`text-sm font-medium truncate ${formData.pacienteId ? 'text-slate-800' : 'text-slate-400'}`}>
                        {formData.pacienteId ? pacientes.find(p => p.id === formData.pacienteId)?.nome : 'Toque para selecionar...'}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Serviço Desejado</label>
                  <div 
                    onClick={() => { setBuscaSelecao(''); setSelecaoAberta('servico'); }}
                    className="w-full p-3 bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl flex items-center justify-between cursor-pointer transition-all"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Sparkles size={16} className={formData.servicoId ? 'text-emerald-600' : 'text-slate-400'} />
                      <span className={`text-sm font-medium truncate ${formData.servicoId ? 'text-slate-800' : 'text-slate-400'}`}>
                        {formData.servicoId ? servicos.find(s => s.id === formData.servicoId)?.nome : 'Toque para selecionar...'}
                      </span>
                    </div>
                    <ChevronRight size={16} className="text-slate-400" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Data do Atendimento</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    
                    <div className="flex justify-between items-center mb-3">
                      <button 
                        type="button" 
                        onClick={() => mudarMes(-1)} 
                        disabled={isMesAtual} 
                        className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft size={16} className="text-slate-600"/>
                      </button>
                      <span className="font-bold text-slate-800 text-sm">
                        {mesesNomes[mesReferencia.getMonth()]} {mesReferencia.getFullYear()}
                      </span>
                      <button 
                        type="button" 
                        onClick={() => mudarMes(1)} 
                        className="p-1.5 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-slate-100"
                      >
                        <ChevronRight size={16} className="text-slate-600"/>
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {diasSemanaNomes.map(d => (
                        <span key={d} className="text-[10px] font-black uppercase text-slate-400 text-center tracking-wider">{d}</span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {diasGrid.map((dia, i) => {
                        if (!dia) return <div key={i} />; 
                        
                        const isPast = dia < hoje;
                        const diaSemana = dia.getDay();
                        const isAtivo = configs.find(c => c.dia_semana === diaSemana)?.ativo;
                        const isDisabled = isPast || !isAtivo;
                        
                        const dataStr = formatarDataInput(dia);
                        const isSelected = dataSelecionada === dataStr;

                        return (
                          <button
                            key={i}
                            type="button"
                            disabled={isDisabled}
                            onClick={() => {
                              setDataSelecionada(dataStr);
                              setFormData({...formData, horaSelecionada: ''});
                            }}
                            className={`h-9 w-full rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                              isSelected 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-105 ring-2 ring-blue-200' 
                                : isDisabled 
                                  ? 'text-slate-300 bg-slate-100/50 cursor-not-allowed' 
                                  : 'text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-600 border border-slate-100 shadow-sm'
                            }`}
                          >
                            {dia.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 flex flex-col flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Clock size={16} className="text-blue-600" /> Horários Disponíveis
                  </label>

                  {!dataSelecionada || !formData.servicoId ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 opacity-60">
                      <Calendar size={32} className="mb-2" />
                      <p className="font-medium text-xs px-4">Selecione o paciente, o serviço e a data no calendário.</p>
                    </div>
                  ) : horariosDisponiveis.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center text-rose-400 bg-rose-50 rounded-xl p-4 border border-rose-100">
                      <AlertCircle size={32} className="mb-2" />
                      <p className="font-bold text-sm">Sem disponibilidade!</p>
                      <p className="font-medium text-[11px] mt-1">A agenda está lotada para este serviço neste dia.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 overflow-y-auto pr-2 max-h-[220px] custom-scrollbar">
                      {horariosDisponiveis.map(hora => (
                        <button
                          key={hora}
                          type="button"
                          onClick={() => setFormData({ ...formData, horaSelecionada: hora })}
                          className={`py-2 rounded-lg font-bold text-sm transition-all border-2 ${
                            formData.horaSelecionada === hora 
                              ? 'bg-blue-600 border-blue-600 text-white shadow-md scale-105' 
                              : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'
                          }`}
                        >
                          {hora}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-auto">
                  <button 
                    type="submit" 
                    disabled={!isFormValido}
                    className="w-full bg-blue-600 text-white font-bold text-base p-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50 flex justify-center items-center gap-2 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                    <Check size={18} /> Confirmar Agendamento
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {selecaoAberta && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl flex flex-col max-h-[80vh] scale-in">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                {selecaoAberta === 'paciente' && <><User className="text-blue-600" /> Selecione o Paciente</>}
                {selecaoAberta === 'servico' && <><Sparkles className="text-emerald-600" /> Selecione o Serviço</>}
                {selecaoAberta === 'data_filtro' && <><CalendarDays className="text-blue-600" /> Escolha o Dia</>}
              </h3>
              <button onClick={() => setSelecaoAberta(null)} className="text-slate-400 hover:text-rose-500 bg-slate-50 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            {selecaoAberta !== 'data_filtro' && (
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  autoFocus
                  value={buscaSelecao}
                  onChange={(e) => setBuscaSelecao(e.target.value)}
                  placeholder={`Buscar...`}
                  className="w-full p-4 pl-11 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
              
              {selecaoAberta === 'paciente' && (
                pacientesFiltrados.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm mt-4 font-medium">Nenhum paciente encontrado.</p>
                ) : (
                  pacientesFiltrados.map(p => (
                    <div
                      key={p.id}
                      onClick={() => { setFormData({...formData, pacienteId: p.id}); setSelecaoAberta(null); }}
                      className={`p-4 rounded-xl cursor-pointer border transition-all flex items-center gap-3 ${
                        formData.pacienteId === p.id 
                          ? 'bg-blue-50 border-blue-200 text-blue-700' 
                          : 'bg-white border-slate-100 text-slate-700 hover:border-blue-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="w-5 flex justify-center">{formData.pacienteId === p.id && <Check size={18} className="text-blue-600" />}</div>
                      <div className="font-bold text-sm truncate">{p.nome}</div>
                    </div>
                  ))
                )
              )}

              {selecaoAberta === 'servico' && (
                servicosFiltrados.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm mt-4 font-medium">Nenhum serviço encontrado.</p>
                ) : (
                  servicosFiltrados.map(s => (
                    <div
                      key={s.id}
                      onClick={() => { setFormData({...formData, servicoId: s.id, horaSelecionada: ''}); setSelecaoAberta(null); }}
                      className={`p-4 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${
                        formData.servicoId === s.id 
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                          : 'bg-white border-slate-100 text-slate-700 hover:border-emerald-300 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3 truncate">
                        <div className="w-5 flex justify-center">{formData.servicoId === s.id && <Check size={18} className="text-emerald-600" />}</div>
                        <span className="font-bold text-sm truncate">{s.nome}</span>
                      </div>
                      <span className="text-xs font-bold opacity-70 ml-2 shrink-0 bg-slate-100 px-2.5 py-1 rounded-md">{s.duracao_minutos} min</span>
                    </div>
                  ))
                )
              )}

              {selecaoAberta === 'data_filtro' && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mt-2">
                  <div className="flex justify-between items-center mb-4">
                    <button 
                      type="button" 
                      onClick={() => mudarMesFiltro(-1)} 
                      className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-slate-100"
                    >
                      <ChevronLeft size={18} className="text-slate-600"/>
                    </button>
                    <span className="font-bold text-slate-800 text-base">
                      {mesesNomes[mesReferenciaFiltro.getMonth()]} {mesReferenciaFiltro.getFullYear()}
                    </span>
                    <button 
                      type="button" 
                      onClick={() => mudarMesFiltro(1)} 
                      className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-slate-100"
                    >
                      <ChevronRight size={18} className="text-slate-600"/>
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {diasSemanaNomes.map(d => (
                      <span key={d} className="text-xs font-black uppercase text-slate-400 text-center tracking-wider">{d}</span>
                    ))}
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {diasGridFiltro.map((dia, i) => {
                      if (!dia) return <div key={i} />; 
                      
                      const dataStr = formatarDataInput(dia);
                      const isSelected = dataFiltroPrincipal === dataStr;

                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setDataFiltroPrincipal(dataStr);
                            setSelecaoAberta(null);
                          }}
                          className={`aspect-square w-full rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                            isSelected 
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-110 ring-2 ring-blue-200' 
                              : 'text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-600 border border-slate-100 shadow-sm'
                          }`}
                        >
                          {dia.getDate()}
                        </button>
                      )
                    })}
                  </div>
                  <button 
                    onClick={() => { setDataFiltroPrincipal(formatarDataInput(hoje)); setSelecaoAberta(null); }}
                    className="w-full mt-4 p-3 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    Voltar para Hoje
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}