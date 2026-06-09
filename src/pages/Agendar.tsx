import { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Clock, User, Scissors, 
  ChevronRight, ChevronLeft, ArrowLeft, CheckCircle, 
  Smartphone, CreditCard, Mail, Sparkles, UserPlus, Search 
} from 'lucide-react';
import { api } from '../services/api';
import Swal from 'sweetalert2';

export function Agendar() {
  const [etapa, setEtapa] = useState(1);
  const [profissionais, setProfissionais] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<string[]>([]);
  
  // ✨ NOVO: Estado para gerenciar o tipo de cliente no Passo 4
  const [modoCliente, setModoCliente] = useState<'ESCOLHA' | 'BUSCANDO_CPF' | 'FORMULARIO'>('ESCOLHA');

  // Dados do Agendamento
  const [selecao, setSelecao] = useState({
    profissionalId: '',
    profissionalNome: '',
    servicoId: '',
    servicoNome: '',
    valor: 0,
    data: '',
    hora: '',
    pacienteNome: '',
    pacienteTelefone: '',
    pacienteCpf: '',
    pacienteEmail: '' 
  });

  // ==========================================
  // MÁSCARAS E BUSCA
  // ==========================================
  const handleCpfChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, ''); 
    if (valor.length > 11) valor = valor.slice(0, 11); 
    
    let cpfFormatado = valor.replace(/(\d{3})(\d)/, '$1.$2')
                            .replace(/(\d{3})(\d)/, '$1.$2')
                            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    
    setSelecao({ ...selecao, pacienteCpf: cpfFormatado });

    // ✨ BUSCA MÁGICA: Se estiver no modo de busca e o CPF estiver completo
    if (modoCliente === 'BUSCANDO_CPF' && valor.length === 11) {
      try {
        Swal.fire({ title: 'Buscando cadastro...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        const res = await api.get(`/agendamento/publico/paciente/${cpfFormatado}`);
        
        // Auto-preenche os dados encontrados
        setSelecao(prev => ({
          ...prev,
          pacienteNome: res.data.nome,
          pacienteTelefone: res.data.telefone,
          pacienteEmail: res.data.email || ''
        }));
        
        Swal.close();
        setModoCliente('FORMULARIO'); // Avança para o formulário preenchido
        
      } catch (err) {
        Swal.fire('Novo Cliente', 'Não encontramos este CPF. Por favor, preencha seus dados para continuar.', 'info');
        setModoCliente('FORMULARIO'); // Avança para o formulário vazio
      }
    }
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let valor = e.target.value.replace(/\D/g, ''); 
    if (valor.length > 11) valor = valor.slice(0, 11);
    
    valor = valor.replace(/^(\d{2})(\d)/g, '($1) $2');
    valor = valor.replace(/(\d)(\d{4})$/, '$1-$2');
    
    setSelecao({ ...selecao, pacienteTelefone: valor });
  };

  // --- CALENDÁRIO ---
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0); 
  const [mesReferencia, setMesReferencia] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  
  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const mudarMes = (offset: number) => {
    setMesReferencia(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + offset, 1));
  };

  const isMesAtual = mesReferencia.getFullYear() === hoje.getFullYear() && mesReferencia.getMonth() === hoje.getMonth();

  const formatarDataInput = (data: Date) => {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
  };

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

  useEffect(() => {
    async function carregarDadosIniciais() {
      try {
        const [resProfissionais, resServicos] = await Promise.all([
          api.get('/usuarios/publico/equipe'), 
          api.get('/servicos/publico')  
        ]);
        
        setProfissionais(resProfissionais.data);
        setServicos(resServicos.data);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    }
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    async function buscarHorariosReais() {
      if (selecao.data && selecao.profissionalId) {
        try {
          const response = await api.get('/agendamento/publico/horarios-disponiveis', {
            params: { data: selecao.data, profissionalId: selecao.profissionalId }
          });
          
          let horariosLivres = response.data;
          const dataAtual = new Date();
          const hojeString = `${dataAtual.getFullYear()}-${String(dataAtual.getMonth() + 1).padStart(2, '0')}-${String(dataAtual.getDate()).padStart(2, '0')}`;

          if (selecao.data === hojeString) {
            const horaAtualEmMinutos = dataAtual.getHours() * 60 + dataAtual.getMinutes();
            horariosLivres = horariosLivres.filter((h: string) => {
              const [hora, minuto] = h.split(':').map(Number);
              const horarioDoAgendamentoEmMinutos = hora * 60 + minuto;
              return horarioDoAgendamentoEmMinutos > horaAtualEmMinutos;
            });
          }
          setHorarios(horariosLivres);
        } catch (error) {
          console.error("Erro ao buscar horários livres:", error);
          setHorarios([]);
        }
      }
    }
    buscarHorariosReais();
  }, [selecao.data, selecao.profissionalId]);

  async function handleFinalizar(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api.post('/agendamento/publico', selecao);
      Swal.fire({
        icon: 'success', title: 'Agendamento Confirmado!',
        text: 'Você receberá a confirmação no seu WhatsApp e e-mail!',
        confirmButtonColor: '#2563eb', customClass: { popup: 'rounded-[2rem]' }
      });
      setEtapa(5); 
    } catch (err: any) {
      const mensagemErro = err.response?.data?.message || 'Não foi possível agendar. Verifique se o horário ainda está disponível.';
      Swal.fire({
        icon: 'error', title: 'Ops!', text: mensagemErro,
        confirmButtonColor: '#ef4444', customClass: { popup: 'rounded-[2rem]' }
      });
    }
  }

  function voltarEtapa() {
    if (etapa === 4) {
      if (modoCliente === 'FORMULARIO' || modoCliente === 'BUSCANDO_CPF') {
        setModoCliente('ESCOLHA');
        setSelecao({...selecao, pacienteCpf: '', pacienteNome: '', pacienteTelefone: '', pacienteEmail: ''});
        return; // Não volta a etapa numérica, só o sub-passo
      } else {
        setSelecao({...selecao, data: '', hora: ''});
      }
    }
    if (etapa === 3) setSelecao({...selecao, servicoId: '', servicoNome: '', valor: 0});
    if (etapa === 2) setSelecao({...selecao, profissionalId: '', profissionalNome: ''});
    setEtapa(etapa - 1);
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-slide-up border border-slate-100">
        
        {/* PAINEL ESQUERDO */}
        <div className="w-full md:w-1/3 bg-slate-900 text-white p-10 flex flex-col relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600 opacity-20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500 opacity-20 rounded-full blur-2xl"></div>

          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-center gap-3 mb-12">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <CalendarIcon size={24} className="text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight">BioSchedule</h1>
                <p className="text-blue-400 text-xs font-bold uppercase tracking-wider">Agendamento Online</p>
              </div>
            </div>

            <div className="flex-1 space-y-8">
              <div className={`transition-all ${etapa >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Profissional</p>
                <div className="flex items-center gap-3">
                  <User size={18} className={selecao.profissionalNome ? 'text-emerald-400' : 'text-slate-400'} />
                  <span className={`font-medium ${selecao.profissionalNome ? 'text-white' : 'text-slate-400'}`}>
                    {selecao.profissionalNome || 'Aguardando seleção...'}
                  </span>
                </div>
              </div>

              <div className={`transition-all ${etapa >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Serviço</p>
                <div className="flex items-center gap-3">
                  <Scissors size={18} className={selecao.servicoNome ? 'text-emerald-400' : 'text-slate-400'} />
                  <span className={`font-medium ${selecao.servicoNome ? 'text-white' : 'text-slate-400'}`}>
                    {selecao.servicoNome || 'Aguardando seleção...'}
                  </span>
                </div>
              </div>

              <div className={`transition-all ${etapa >= 3 ? 'opacity-100' : 'opacity-40'}`}>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Data e Hora</p>
                <div className="flex items-center gap-3">
                  <Clock size={18} className={selecao.hora ? 'text-emerald-400' : 'text-slate-400'} />
                  <span className={`font-medium ${selecao.hora ? 'text-white' : 'text-slate-400'}`}>
                    {selecao.data ? `${selecao.data.split('-').reverse().join('/')} às ${selecao.hora}` : 'Aguardando seleção...'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-auto pt-8 border-t border-slate-800">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Total Estimado</span>
                <span className="text-2xl font-black text-white">
                  R$ {selecao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PAINEL DIREITO */}
        <div className="w-full md:w-2/3 p-10 flex flex-col bg-white">
          {etapa > 1 && etapa < 5 && (
            <button onClick={voltarEtapa} className="self-start mb-6 flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold transition-colors">
              <ArrowLeft size={18} /> Voltar
            </button>
          )}

          <div className="flex-1">
            {etapa === 1 && (
              <div className="animate-slide-up h-full flex flex-col">
                <h2 className="text-3xl font-black text-slate-800 mb-2">Com quem deseja agendar?</h2>
                <p className="text-slate-500 mb-8">Selecione o profissional de sua preferência.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {profissionais.map(prof => (
                    <button 
                      key={prof.id}
                      onClick={() => { 
                        setSelecao({...selecao, profissionalId: prof.id, profissionalNome: prof.nome}); 
                        setEtapa(2); 
                      }}
                      className="p-6 border-2 border-slate-100 rounded-[2rem] flex items-center gap-4 hover:border-blue-600 hover:shadow-lg transition-all text-left group"
                    >
                      <div className="w-16 h-16 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <User size={32} />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600">{prof.nome}</h3>
                        <p className="text-sm text-slate-400 font-medium">{prof.role === 'ADMIN' ? 'Especialista' : 'Profissional'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {etapa === 2 && (
              <div className="animate-slide-up h-full flex flex-col">
                <h2 className="text-3xl font-black text-slate-800 mb-2">Qual o procedimento?</h2>
                <p className="text-slate-500 mb-8">Escolha o serviço que deseja realizar com <b>{selecao.profissionalNome}</b>.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {servicos.map(serv => (
                    <button 
                      key={serv.id}
                      onClick={() => { 
                        setSelecao({...selecao, servicoId: serv.id, servicoNome: serv.nome, valor: Number(serv.valor)}); 
                        setEtapa(3); 
                      }}
                      className="p-6 border-2 border-slate-100 rounded-[2rem] hover:border-blue-600 hover:shadow-lg transition-all text-left group flex flex-col justify-between"
                    >
                      <div className="mb-4">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <Scissors size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">{serv.nome}</h3>
                        <p className="text-sm text-slate-500 mt-1 line-clamp-2">{serv.descricao || 'Procedimento estético especializado.'}</p>
                      </div>
                      <div className="flex justify-between items-center w-full pt-4 border-t border-slate-50">
                        <span className="text-slate-400 font-bold text-sm bg-slate-100 px-3 py-1 rounded-lg">{serv.duracao_minutos} min</span>
                        <span className="text-blue-600 font-black text-lg">R$ {Number(serv.valor).toFixed(2)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {etapa === 3 && (
              <div className="animate-slide-up h-full flex flex-col">
                <h2 className="text-3xl font-black text-slate-800 mb-2">Escolha o melhor horário</h2>
                <p className="text-slate-500 mb-8">Nossa agenda para <b>{selecao.servicoNome}</b>.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 shadow-sm">
                    <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <CalendarIcon size={18} className="text-blue-600" /> Selecione a Data
                    </label>
                    <div className="flex justify-between items-center mb-4 bg-white p-2 rounded-xl shadow-sm border border-slate-100">
                      <button type="button" onClick={() => mudarMes(-1)} disabled={isMesAtual} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                        <ChevronLeft size={18} className="text-slate-600"/>
                      </button>
                      <span className="font-bold text-slate-800 text-sm uppercase tracking-wider">
                        {mesesNomes[mesReferencia.getMonth()]} {mesReferencia.getFullYear()}
                      </span>
                      <button type="button" onClick={() => mudarMes(1)} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                        <ChevronRight size={18} className="text-slate-600"/>
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                      {diasSemanaNomes.map(d => (
                        <span key={d} className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{d}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {diasGrid.map((dia, i) => {
                        if (!dia) return <div key={i} />; 
                        const isPast = dia < hoje;
                        const dataStr = formatarDataInput(dia);
                        const isSelected = selecao.data === dataStr;
                        return (
                          <button
                            key={i} type="button" disabled={isPast}
                            onClick={() => setSelecao({...selecao, data: dataStr, hora: ''})}
                            className={`aspect-square w-full rounded-xl flex items-center justify-center text-sm font-bold transition-all ${
                              isSelected ? 'bg-blue-600 text-white shadow-md' : isPast ? 'text-slate-300 opacity-50 cursor-not-allowed' : 'text-slate-700 bg-white hover:bg-blue-50 border border-slate-100 shadow-sm'
                            }`}
                          >
                            {dia.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 shadow-sm flex flex-col">
                    <label className="block text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                      <Clock size={18} className="text-blue-600" /> Horários Disponíveis
                    </label>
                    {selecao.data ? (
                      horarios.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[260px] pr-2 custom-scrollbar">
                          {horarios.map(h => (
                            <button 
                              key={h} onClick={() => setSelecao({...selecao, hora: h})}
                              className={`p-3 rounded-xl font-bold text-sm transition-all border-2 ${
                                selecao.hora === h ? 'bg-blue-600 border-blue-600 text-white' : 'border-white bg-white text-slate-600 shadow-sm'
                              }`}
                            >
                              {h}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-center">
                          <p className="text-rose-500 font-medium text-sm p-4 bg-rose-50 rounded-xl text-center">Nenhum horário disponível neste dia.</p>
                        </div>
                      )
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-sm font-medium border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center">
                        <CalendarIcon size={32} className="mb-2 opacity-50" /> Selecione uma data ao lado
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-auto pt-8">
                  <button 
                    disabled={!selecao.data || !selecao.hora} onClick={() => setEtapa(4)}
                    className="w-full md:w-auto md:min-w-[250px] md:ml-auto bg-blue-600 text-white p-4 rounded-2xl font-bold text-lg disabled:opacity-50 hover:bg-blue-700 transition-all shadow-lg flex justify-center items-center gap-2"
                  >
                    Continuar <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            )}

            {etapa === 4 && (
              <div className="animate-slide-up h-full flex flex-col">
                
                {/* ✨ SUB-ETAPA 4.1: ESCOLHA DO CLIENTE */}
                {modoCliente === 'ESCOLHA' && (
                  <div className="flex-1 flex flex-col justify-center animate-slide-up">
                    <h2 className="text-3xl font-black text-slate-800 mb-2 text-center">Falta pouco!</h2>
                    <p className="text-slate-500 mb-10 text-center">Para finalizar, como você prefere se identificar?</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <button 
                        onClick={() => setModoCliente('BUSCANDO_CPF')}
                        className="p-8 border-2 border-blue-100 bg-blue-50/50 rounded-[2rem] hover:border-blue-600 hover:shadow-lg transition-all group flex flex-col items-center text-center"
                      >
                        <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                          <Sparkles size={32} />
                        </div>
                        <h3 className="font-black text-slate-800 text-xl mb-2 group-hover:text-blue-600">Já sou cliente</h3>
                        <p className="text-slate-500 text-sm font-medium">Busca rápida usando apenas o seu CPF.</p>
                      </button>

                      <button 
                        onClick={() => setModoCliente('FORMULARIO')}
                        className="p-8 border-2 border-emerald-100 bg-emerald-50/50 rounded-[2rem] hover:border-emerald-600 hover:shadow-lg transition-all group flex flex-col items-center text-center"
                      >
                        <div className="w-16 h-16 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                          <UserPlus size={32} />
                        </div>
                        <h3 className="font-black text-slate-800 text-xl mb-2 group-hover:text-emerald-600">Primeira vez</h3>
                        <p className="text-slate-500 text-sm font-medium">Preenchimento rápido do formulário.</p>
                      </button>
                    </div>
                  </div>
                )}

                {/* ✨ SUB-ETAPA 4.2: BUSCANDO CPF */}
                {modoCliente === 'BUSCANDO_CPF' && (
                  <div className="flex-1 flex flex-col animate-slide-up max-w-md mx-auto w-full mt-10">
                    <div className="text-center mb-8">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search size={32} />
                      </div>
                      <h2 className="text-2xl font-black text-slate-800 mb-2">Qual o seu CPF?</h2>
                      <p className="text-slate-500">Vamos buscar seus dados automaticamente.</p>
                    </div>

                    <div className="relative">
                      <CreditCard className="absolute left-4 top-4 text-slate-400" size={24} />
                      <input 
                        autoFocus
                        type="text" 
                        placeholder="000.000.000-00" 
                        value={selecao.pacienteCpf} 
                        onChange={handleCpfChange} 
                        className="w-full p-4 pl-14 bg-white border-2 border-slate-200 rounded-2xl outline-none focus:border-blue-500 text-lg font-bold text-center tracking-widest shadow-sm"
                      />
                    </div>
                  </div>
                )}

                {/* ✨ SUB-ETAPA 4.3: FORMULÁRIO FINAL (Vazio ou Preenchido) */}
                {modoCliente === 'FORMULARIO' && (
                  <form onSubmit={handleFinalizar} className="flex flex-col h-full animate-slide-up">
                    <h2 className="text-3xl font-black text-slate-800 mb-2">Confirme seus dados</h2>
                    <p className="text-slate-500 mb-8">Nós enviaremos a confirmação do agendamento por e-mail.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Nome Completo</label>
                        <div className="relative">
                          <User className="absolute left-4 top-4 text-slate-400" size={20} />
                          <input required type="text" placeholder="Seu nome aqui" value={selecao.pacienteNome} onChange={e => setSelecao({...selecao, pacienteNome: e.target.value})} className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"/>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">CPF *</label>
                        <div className="relative">
                          <CreditCard className="absolute left-4 top-4 text-slate-400" size={20} />
                          <input required type="text" placeholder="000.000.000-00" value={selecao.pacienteCpf} onChange={handleCpfChange} className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"/>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">WhatsApp</label>
                        <div className="relative">
                          <Smartphone className="absolute left-4 top-4 text-slate-400" size={20} />
                          <input required type="tel" placeholder="(00) 00000-0000" value={selecao.pacienteTelefone} onChange={handleTelefoneChange} className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"/>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">E-mail para Confirmação *</label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
                          <input required type="email" placeholder="seu.email@exemplo.com" value={selecao.pacienteEmail} onChange={e => setSelecao({...selecao, pacienteEmail: e.target.value})} className="w-full p-4 pl-12 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-medium"/>
                        </div>
                      </div>
                    </div>
                    <div className="mt-auto pt-8 text-right">
                      <button type="submit" className="w-full md:w-auto md:min-w-[300px] bg-emerald-500 text-white p-4 rounded-2xl font-bold text-lg hover:bg-emerald-600 transition-all shadow-lg flex items-center justify-center gap-2">
                        <CheckCircle size={24} /> Confirmar Agendamento
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {etapa === 5 && (
              <div className="animate-slide-up h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-32 h-32 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-8 relative">
                  <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
                  <CheckCircle size={64} />
                </div>
                <h2 className="text-4xl font-black text-slate-800 mb-4 tracking-tight">Tudo Certo, {selecao.pacienteNome.split(' ')[0]}!</h2>
                <p className="text-slate-500 text-lg mb-8 max-w-md">
                  Seu horário para <b>{selecao.servicoNome}</b> com <b>{selecao.profissionalNome}</b> está reservado. Enviamos a confirmação para o seu <b>WhatsApp</b> e <b>e-mail</b> ({selecao.pacienteEmail}).
                </p>
                <button onClick={() => window.location.reload()} className="px-8 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all">
                  Novo Agendamento
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes slideUpFade { 0% { opacity: 0; transform: translateY(20px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-slide-up { animation: slideUpFade 0.5s ease-out forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
}