import { useState, useMemo, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import { 
  FileText, 
  DownloadCloud, 
  FileSpreadsheet, 
  TrendingUp, 
  CalendarDays, 
  Users, 
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  X,
  CalendarSearch,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import Swal from 'sweetalert2';

type TipoRelatorio = 'financeiro' | 'agenda' | 'pacientes';

export function Relatorios() {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const primeiroDiaMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  
  const formatarDataInput = (data: Date) => data.toISOString().split('T')[0];
  const formatarDataBR = (dataStr: string) => {
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
  };

  const [tipoSelecionado, setTipoSelecionado] = useState<TipoRelatorio>('financeiro');
  const [dataInicio, setDataInicio] = useState(formatarDataInput(primeiroDiaMes));
  const [dataFim, setDataFim] = useState(formatarDataInput(hoje));
  const [exportando, setExportando] = useState<'pdf' | 'excel' | null>(null);

  // Preview (contagem de registros)
  const [preview, setPreview] = useState<{ count: number } | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // --- CALENDÁRIO CUSTOMIZADO ---
  const [calendarioAberto, setCalendarioAberto] = useState<'inicio' | 'fim' | null>(null);
  const [mesReferencia, setMesReferencia] = useState(new Date(hoje.getFullYear(), hoje.getMonth(), 1));

  const mesesNomes = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const diasSemanaNomes = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const mudarMes = (offset: number) => {
    setMesReferencia(new Date(mesReferencia.getFullYear(), mesReferencia.getMonth() + offset, 1));
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

  // Buscar preview sempre que tipo ou período mudar
  const buscarPreview = useCallback(async () => {
    if (dataInicio > dataFim) {
      setPreview(null);
      return;
    }
    setLoadingPreview(true);
    try {
      const res = await api.get('/relatorios/preview', {
        params: { tipo: tipoSelecionado, inicio: dataInicio, fim: dataFim },
      });
      setPreview(res.data);
    } catch {
      setPreview(null);
    } finally {
      setLoadingPreview(false);
    }
  }, [tipoSelecionado, dataInicio, dataFim]);

  useEffect(() => {
    buscarPreview();
  }, [buscarPreview]);

  async function handleExportar(formato: 'pdf' | 'excel') {
    if (dataInicio > dataFim) {
      Swal.fire('Data Inválida', 'A data inicial não pode ser maior que a final.', 'error');
      return;
    }

    if (preview?.count === 0) {
      Swal.fire('Sem Dados', 'Não há registros para o período selecionado.', 'warning');
      return;
    }

    try {
      setExportando(formato);
      Swal.fire({
        title: `Gerando ${formato.toUpperCase()}...`,
        text: 'Buscando os dados no servidor, aguarde...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const response = await api.get('/relatorios/exportar', { 
        params: { tipo: tipoSelecionado, inicio: dataInicio, fim: dataFim, formato },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `BioSchedule_${tipoSelecionado}_${dataInicio}.${formato === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      Swal.fire({ icon: 'success', title: 'Download Concluído!', timer: 2000, showConfirmButton: false });
    } catch {
      Swal.fire('Erro', 'Não foi possível baixar o arquivo.', 'error');
    } finally {
      setExportando(null);
    }
  }

  const tipos = [
    { 
      id: 'financeiro', nome: 'Faturamento', 
      desc: 'Receitas por procedimento concluído, ticket médio e top serviços.',
      icon: TrendingUp, 
      color: 'blue'
    },
    { 
      id: 'agenda', nome: 'Agendamentos', 
      desc: 'Todos os agendamentos com status, paciente e profissional.',
      icon: CalendarDays, 
      color: 'indigo'
    },
    { 
      id: 'pacientes', nome: 'Pacientes', 
      desc: 'Lista completa de clientes cadastrados no período.',
      icon: Users, 
      color: 'violet'
    }
  ] as const;

  const previewLabel = () => {
    if (dataInicio > dataFim) return { text: 'Data inicial maior que a final', warn: true };
    if (loadingPreview) return null;
    if (!preview) return null;
    if (preview.count === 0) return { text: 'Nenhum registro encontrado neste período', warn: true };
    
    const labels: Record<string, string> = {
      financeiro: `${preview.count} atendimento${preview.count !== 1 ? 's' : ''} concluído${preview.count !== 1 ? 's' : ''}`,
      agenda: `${preview.count} agendamento${preview.count !== 1 ? 's' : ''}`,
      pacientes: `${preview.count} paciente${preview.count !== 1 ? 's' : ''} cadastrado${preview.count !== 1 ? 's' : ''}`,
    };
    return { text: labels[tipoSelecionado], warn: false };
  };

  const labelInfo = previewLabel();
  const semDados = preview?.count === 0 || dataInicio > dataFim;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      
      {/* HEADER DEGRADÊ */}
      <div className="relative bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 rounded-[2.5rem] p-10 mb-10 overflow-hidden shadow-2xl animate-slide-up">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
        <div className="relative z-10 text-white">
          <div className="flex items-center gap-2 mb-2 opacity-80 font-medium tracking-wider uppercase text-sm">
            <DownloadCloud size={16} /> Central de Dados
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">Exportar Relatórios</h1>
          <p className="text-blue-100 text-lg max-w-xl font-medium">Extraia a inteligência da sua clínica em PDF ou Excel.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* COLUNA ESQUERDA: ESCOLHA DO TIPO */}
        <div className="lg:col-span-7 space-y-6 animate-slide-up delay-100">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">1</div>
            <h2 className="text-xl font-bold text-slate-800">Selecione o Módulo</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tipos.map((tipo) => {
              const Icon = tipo.icon;
              const isSelected = tipoSelecionado === tipo.id;
              return (
                <div 
                  key={tipo.id} 
                  onClick={() => setTipoSelecionado(tipo.id)} 
                  className={`relative p-5 rounded-3xl border-2 transition-all cursor-pointer overflow-hidden ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100 scale-[1.02]' 
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  {isSelected && <CheckCircle2 size={20} className="absolute top-3 right-3 text-blue-500" />}
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all ${
                    isSelected ? 'bg-blue-500 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon size={24} />
                  </div>
                  <h3 className={`text-base font-bold mb-1 ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                    {tipo.nome}
                  </h3>
                  <p className={`text-xs font-medium leading-relaxed ${isSelected ? 'text-blue-700/80' : 'text-slate-400'}`}>
                    {tipo.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* PREVIEW DE CONTAGEM */}
          <div className={`rounded-2xl px-5 py-4 flex items-center gap-3 transition-all ${
            loadingPreview 
              ? 'bg-slate-50 border border-slate-100'
              : labelInfo?.warn 
                ? 'bg-amber-50 border border-amber-200' 
                : 'bg-emerald-50 border border-emerald-200'
          }`}>
            {loadingPreview ? (
              <>
                <Loader2 size={18} className="text-slate-400 animate-spin shrink-0" />
                <span className="text-sm font-medium text-slate-400">Consultando registros...</span>
              </>
            ) : labelInfo ? (
              <>
                {labelInfo.warn 
                  ? <AlertCircle size={18} className="text-amber-500 shrink-0" />
                  : <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                }
                <span className={`text-sm font-bold ${labelInfo.warn ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {labelInfo.text}
                </span>
              </>
            ) : null}
          </div>
        </div>

        {/* COLUNA DIREITA: FILTROS + DOWNLOAD */}
        <div className="lg:col-span-5 space-y-8 animate-slide-up delay-200">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">2</div>
              <h2 className="text-xl font-bold text-slate-800">Defina o Período</h2>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              {/* DATA INÍCIO */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Inicial</label>
                <button 
                  onClick={() => setCalendarioAberto('inicio')}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-blue-300 transition-all"
                >
                  <span className="font-bold text-slate-700">{formatarDataBR(dataInicio)}</span>
                  <CalendarSearch size={20} className="text-blue-600" />
                </button>
              </div>

              {/* DATA FIM */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Data Final</label>
                <button 
                  onClick={() => setCalendarioAberto('fim')}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between hover:border-blue-300 transition-all"
                >
                  <span className="font-bold text-slate-700">{formatarDataBR(dataFim)}</span>
                  <CalendarSearch size={20} className="text-blue-600" />
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">3</div>
              <h2 className="text-xl font-bold text-slate-800">Baixar Relatório</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => handleExportar('pdf')} 
                disabled={exportando !== null || !!semDados}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-rose-100 hover:border-rose-400 hover:shadow-md rounded-3xl transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <div className="w-12 h-12 bg-rose-50 group-hover:bg-rose-100 rounded-2xl flex items-center justify-center transition-colors">
                  {exportando === 'pdf' 
                    ? <Loader2 size={24} className="text-rose-500 animate-spin" />
                    : <FileText size={24} className="text-rose-600" />
                  }
                </div>
                <span className="font-bold text-rose-700 text-sm">Baixar PDF</span>
              </button>
              <button 
                onClick={() => handleExportar('excel')} 
                disabled={exportando !== null || !!semDados}
                className="flex flex-col items-center justify-center gap-3 p-6 bg-white border-2 border-emerald-100 hover:border-emerald-400 hover:shadow-md rounded-3xl transition-all disabled:opacity-40 disabled:cursor-not-allowed group"
              >
                <div className="w-12 h-12 bg-emerald-50 group-hover:bg-emerald-100 rounded-2xl flex items-center justify-center transition-colors">
                  {exportando === 'excel'
                    ? <Loader2 size={24} className="text-emerald-500 animate-spin" />
                    : <FileSpreadsheet size={24} className="text-emerald-600" />
                  }
                </div>
                <span className="font-bold text-emerald-700 text-sm">Baixar Excel</span>
              </button>
            </div>

            {semDados && (
              <p className="text-center text-xs text-slate-400 font-medium mt-3">
                Selecione um período com registros para habilitar o download.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* MODAL DE CALENDÁRIO */}
      {calendarioAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 z-[70]">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl scale-in relative">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <CalendarIcon className="text-blue-600" size={20} />
                Selecione a Data {calendarioAberto === 'inicio' ? 'Inicial' : 'Final'}
              </h3>
              <button onClick={() => setCalendarioAberto(null)} className="text-slate-400 hover:text-rose-500 p-2 bg-slate-50 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div className="flex justify-between items-center mb-4">
                <button onClick={() => mudarMes(-1)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-slate-100 transition-colors">
                  <ChevronLeft size={18} className="text-slate-600"/>
                </button>
                <span className="font-bold text-slate-800">
                  {mesesNomes[mesReferencia.getMonth()]} {mesReferencia.getFullYear()}
                </span>
                <button onClick={() => mudarMes(1)} className="p-2 bg-white rounded-lg shadow-sm border border-slate-100 hover:bg-slate-100 transition-colors">
                  <ChevronRight size={18} className="text-slate-600"/>
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
                  const dataStr = formatarDataInput(dia);
                  const isSelected = (calendarioAberto === 'inicio' ? dataInicio : dataFim) === dataStr;

                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        if (calendarioAberto === 'inicio') setDataInicio(dataStr);
                        else setDataFim(dataStr);
                        setCalendarioAberto(null);
                      }}
                      className={`aspect-square w-full rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                        isSelected 
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-110' 
                          : 'text-slate-700 bg-white hover:bg-blue-50 hover:text-blue-600 border border-slate-100 shadow-sm'
                      }`}
                    >
                      {dia.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}