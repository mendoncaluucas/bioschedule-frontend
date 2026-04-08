import { useEffect, useState, useRef } from 'react';
import { api } from '../services/api';
import { Users, Plus, Search, Phone, Mail, FileText, Calendar, Trash2, Edit2, X, Save, ClipboardList, CheckCircle, Image as ImageIcon, Upload, ZoomIn, User, Check } from 'lucide-react';
import Swal from 'sweetalert2';

interface Paciente { id: string; nome: string; cpf: string; telefone: string; email?: string; }
interface FotoPaciente { id: string; url: string; legenda?: string; criado_em: string; }
interface PacienteDetalhado extends Paciente {
  observacoes?: string;
  fotos: FotoPaciente[];
  agendamentos: { id: string; data_inicio: string; status: string; servico: { nome: string }; }[];
}

// --- FUNÇÕES DE MÁSCARA (CPF E TELEFONE) ---
const formatarCPF = (valor: string) => {
  return valor
    .replace(/\D/g, '') 
    .replace(/(\d{3})(\d)/, '$1.$2') 
    .replace(/(\d{3})(\d)/, '$1.$2') 
    .replace(/(\d{3})(\d{1,2})/, '$1-$2') 
    .replace(/(-\d{2})\d+?$/, '$1'); 
};

const formatarTelefone = (valor: string) => {
  let v = valor.replace(/\D/g, ''); 
  if (v.length <= 10) {
    return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  }
  return v.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').substring(0, 15); 
};

export function Pacientes() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  // --- ESTADOS DO MODAL DE CADASTRO / EDIÇÃO ---
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [salvandoPaciente, setSalvandoPaciente] = useState(false);
  const [patientFormData, setPatientFormData] = useState({
    id: '', nome: '', cpf: '', telefone: '', email: ''
  });

  // --- ESTADOS DO PRONTUÁRIO DETALHADO ---
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [pacienteDetalhado, setPacienteDetalhado] = useState<PacienteDetalhado | null>(null);
  const [observacoesDraft, setObservacoesDraft] = useState('');
  const [salvandoNotas, setSalvandoNotas] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [enviandoFoto, setEnviandoFoto] = useState(false);
  const [fotoEnlarged, setFotoEnlarged] = useState<string | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  useEffect(() => { carregarPacientes(); }, []);

  async function carregarPacientes() {
    try {
      setCarregando(true);
      const response = await api.get('/paciente');
      setPacientes(response.data);
    } catch (error) {
      Swal.fire('Erro', 'Não foi possível carregar os pacientes.', 'error');
    } finally { setCarregando(false); }
  }

  // --- FUNÇÕES DE CADASTRO, EDIÇÃO E EXCLUSÃO ---

  function abrirModalNovo() {
    setPatientFormData({ id: '', nome: '', cpf: '', telefone: '', email: '' });
    setIsPatientModalOpen(true);
  }

  function abrirModalEditar(p: Paciente) {
    setPatientFormData({ id: p.id, nome: p.nome, cpf: p.cpf, telefone: p.telefone, email: p.email || '' });
    setIsPatientModalOpen(true);
  }

  async function handleSavePatient(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSalvandoPaciente(true);
      
      // Se tem ID, é Edição. Se não tem, é Novo Cadastro.
      if (patientFormData.id) {
        await api.put(`/paciente/${patientFormData.id}`, patientFormData);
        Swal.fire({ icon: 'success', title: 'Paciente atualizado!', timer: 1500, showConfirmButton: false });
      } else {
        await api.post('/paciente', patientFormData);
        Swal.fire({ icon: 'success', title: 'Paciente cadastrado!', timer: 1500, showConfirmButton: false });
      }
      
      setIsPatientModalOpen(false);
      carregarPacientes(); 
    } catch (error) {
      Swal.fire('Erro', 'Não foi possível salvar o paciente.', 'error');
    } finally {
      setSalvandoPaciente(false);
    }
  }

  async function deletarPaciente(id: string, nome: string) {
    const confirmar = await Swal.fire({ 
      title: 'Excluir paciente?', 
      text: `Tem certeza que deseja apagar os registros de ${nome}? Essa ação não pode ser desfeita.`, 
      icon: 'warning', 
      showCancelButton: true, 
      confirmButtonColor: '#e11d48', 
      cancelButtonText: 'Cancelar',
      confirmButtonText: 'Sim, excluir!' 
    });

    if (confirmar.isConfirmed) {
      try {
        await api.delete(`/paciente/${id}`);
        setPacientes(pacientes.filter(p => p.id !== id));
        Swal.fire({ icon: 'success', title: 'Excluído!', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      } catch (error) { 
        Swal.fire('Erro', 'Não foi possível excluir o paciente. Verifique se ele possui agendamentos.', 'error'); 
      }
    }
  }

  // --- FUNÇÕES DO PRONTUÁRIO E GALERIA ---

  async function abrirProntuario(id: string) {
    try {
      Swal.showLoading();
      const response = await api.get(`/paciente/${id}`); 
      setPacienteDetalhado(response.data);
      setObservacoesDraft(response.data.observacoes || '');
      setIsDetailsOpen(true);
      Swal.close();
    } catch (error) { Swal.fire('Erro', 'Não foi possível abrir o prontuário.', 'error'); }
  }

  async function salvarObservacoes() {
    if (!pacienteDetalhado) return;
    try {
      setSalvandoNotas(true);
      await api.patch(`/paciente/${pacienteDetalhado.id}`, { observacoes: observacoesDraft });
      setPacienteDetalhado({ ...pacienteDetalhado, observacoes: observacoesDraft });
      Swal.fire({ icon: 'success', title: 'Notas salvas!', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    } catch (error) { Swal.fire('Erro', 'Não foi possível salvar.', 'error'); } 
    finally { setSalvandoNotas(false); }
  }

  async function uploadFile(file: File) {
    if (!pacienteDetalhado) return;
    if (!file.type.startsWith('image/')) { Swal.fire('Arquivo Inválido', 'Por favor, selecione apenas imagens.', 'warning'); return; }

    const formData = new FormData(); formData.append('file', file);
    try {
      setEnviandoFoto(true); Swal.fire({ title: 'Enviando imagem...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const response = await api.post(`/paciente/${pacienteDetalhado.id}/foto`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setPacienteDetalhado({ ...pacienteDetalhado, fotos: [response.data, ...pacienteDetalhado.fotos] });
      Swal.fire({ icon: 'success', title: 'Imagem importada!', timer: 1500, showConfirmButton: false });
    } catch (error) { Swal.fire('Erro no Upload', 'Não foi possível salvar a imagem.', 'error'); } 
    finally { setEnviandoFoto(false); if (fileInputRef.current) fileInputRef.current.value = ''; }
  }

  const handleTrigerUpload = () => fileInputRef.current?.click();
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) uploadFile(file); };
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = 'copy'; };
  const handleDragEnter = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDraggingOver(true); };
  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDraggingOver(false); };
  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation(); setIsDraggingOver(false); const file = event.dataTransfer.files?.[0]; if (file) uploadFile(file); };

  async function deletarFoto(fotoId: string) {
    if (!pacienteDetalhado) return;
    const confirmar = await Swal.fire({ title: 'Excluir imagem?', text: "Essa ação não pode ser desfeita!", icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', confirmButtonText: 'Sim, excluir!' });
    if (confirmar.isConfirmed) {
      try {
        await api.delete(`/paciente/${pacienteDetalhado.id}/foto/${fotoId}`);
        setPacienteDetalhado({ ...pacienteDetalhado, fotos: pacienteDetalhado.fotos.filter(f => f.id !== fotoId) });
        Swal.fire({ icon: 'success', title: 'Deletada!', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      } catch (error) { Swal.fire('Erro', 'Não foi possível excluir a imagem.', 'error'); }
    }
  }

  const pacientesFiltrados = pacientes.filter(p => p.nome.toLowerCase().includes(busca.toLowerCase()) || p.cpf.includes(busca));
  const statusConfig: any = { CONCLUIDO: { cor: 'bg-emerald-100 text-emerald-700' }, FALTOU: { cor: 'bg-rose-100 text-rose-700' }, CANCELADO: { cor: 'bg-slate-100 text-slate-700' }, DEFAULT: { cor: 'bg-blue-100 text-blue-700' } };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <header className="mb-10 flex justify-between items-end gap-4 animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Users className="text-blue-600" size={36} /> Pacientes
          </h1>
          <p className="text-slate-500 font-medium mt-2">Cadastros e Prontuários Visuais.</p>
        </div>
        <button 
          onClick={abrirModalNovo}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 shrink-0"
        >
          <Plus size={20} /> Novo Paciente
        </button>
      </header>

      <div className="relative mb-8 animate-slide-up delay-100">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
        <input 
          type="text" value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar por nome ou CPF..."
          className="w-full p-5 pl-14 bg-white border border-slate-100 rounded-[2rem] outline-none focus:ring-2 focus:ring-blue-200 text-lg shadow-sm"
        />
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden animate-slide-up delay-200">
        {carregando ? (
          <div className="p-20 text-center text-slate-500 flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div> Carregando lista...
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Nome / Prontuário</th>
                <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider">CPF</th>
                <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider">Contato</th>
                <th className="p-6 text-sm font-bold text-slate-500 uppercase tracking-wider text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pacientesFiltrados.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-6 cursor-pointer" onClick={() => abrirProntuario(p.id)}>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-bold text-xl border border-blue-100">
                        {p.nome.substring(0, 1).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-lg hover:text-blue-600 transition-colors">{p.nome}</p>
                        <p className="text-sm text-blue-600 font-bold flex items-center gap-1.5 mt-0.5"><ClipboardList size={14}/> Abrir Prontuário</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6 text-slate-600 font-medium">{p.cpf}</td>
                  <td className="p-6 space-y-1">
                    <p className="text-slate-700 font-medium flex items-center gap-2"><Phone size={16} className="text-slate-400" /> {p.telefone}</p>
                    {p.email && <p className="text-slate-500 text-sm flex items-center gap-2"><Mail size={16} className="text-slate-400" /> {p.email}</p>}
                  </td>
                  <td className="p-6">
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => abrirModalEditar(p)}
                        className="p-3 bg-slate-100 text-slate-600 rounded-xl hover:bg-blue-100 hover:text-blue-700 transition-colors"
                        title="Editar Paciente"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => deletarPaciente(p.id, p.nome)}
                        className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 hover:text-rose-700 transition-colors"
                        title="Excluir Paciente"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pacientesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 font-medium">Nenhum paciente encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL: CADASTRO / EDIÇÃO DE PACIENTE */}
      {isPatientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-2xl shadow-2xl scale-in">
            
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <User className="text-blue-600" /> {patientFormData.id ? 'Editar Paciente' : 'Cadastrar Novo Paciente'}
              </h2>
              <button onClick={() => setIsPatientModalOpen(false)} className="text-slate-400 hover:text-rose-500 p-2 bg-slate-50 rounded-full transition-colors">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePatient} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div className="col-span-full">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nome Completo</label>
                  <input 
                    required autoFocus type="text" 
                    value={patientFormData.nome} 
                    onChange={e => setPatientFormData({...patientFormData, nome: e.target.value})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">CPF</label>
                  <input 
                    required type="text" 
                    maxLength={14}
                    value={patientFormData.cpf} 
                    onChange={e => setPatientFormData({...patientFormData, cpf: formatarCPF(e.target.value)})} 
                    placeholder="000.000.000-00"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Telefone / WhatsApp</label>
                  <input 
                    required type="text" 
                    maxLength={15}
                    value={patientFormData.telefone} 
                    onChange={e => setPatientFormData({...patientFormData, telefone: formatarTelefone(e.target.value)})} 
                    placeholder="(00) 00000-0000"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" 
                  />
                </div>

                <div className="col-span-full">
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">E-mail (Opcional)</label>
                  <input 
                    type="email" 
                    value={patientFormData.email} 
                    onChange={e => setPatientFormData({...patientFormData, email: e.target.value})} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" 
                  />
                </div>

              </div>

              <div className="pt-4 flex justify-end">
                <button 
                  type="submit" 
                  disabled={salvandoPaciente || !patientFormData.nome || !patientFormData.cpf || !patientFormData.telefone} 
                  className="bg-blue-600 text-white font-bold text-base px-6 py-3 rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                >
                  {salvandoPaciente ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Check size={18} />}
                  {salvandoPaciente ? 'Salvando...' : 'Salvar Paciente'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* MODAL: PRONTUÁRIO DETALHADO */}
      {isDetailsOpen && pacienteDetalhado && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity" onClick={() => setIsDetailsOpen(false)}>
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden flex flex-col scale-in" onClick={e => e.stopPropagation()}>
            <header className="p-8 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center font-black text-4xl shadow-lg shadow-blue-600/20">{pacienteDetalhado.nome.substring(0, 1).toUpperCase()}</div>
                  <div>
                    <span className="text-sm font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">Ficha Clínica Central</span>
                    <h2 className="text-4xl font-extrabold text-slate-950 tracking-tighter mt-1">{pacienteDetalhado.nome}</h2>
                    <p className="text-slate-500 font-medium mt-1">CPF: {pacienteDetalhado.cpf} | Tel: {pacienteDetalhado.telefone}</p>
                  </div>
                </div>
                <button onClick={() => setIsDetailsOpen(false)} className="text-slate-400 hover:text-rose-500 p-3 bg-white rounded-full border hover:bg-rose-50 transition-colors hover:rotate-90 transform"><X size={24} /></button>
            </header>

            <div className="flex-1 p-10 overflow-y-auto custom-scrollbar space-y-12 grid grid-cols-1 xl:grid-cols-3 xl:gap-10 xl:space-y-0">
              <div className="xl:col-span-2 space-y-12">
                <section className={`p-8 rounded-3xl border transition-all duration-300 ${isDraggingOver ? 'border-4 border-dashed border-blue-500 bg-blue-50 shadow-inner' : 'border-slate-100 bg-slate-50' }`} onDragOver={handleDragOver} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                  <div className="flex items-center justify-between mb-6 relative">
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3"><ImageIcon className="text-blue-600" size={28} /> Galeria</h3>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    <button onClick={handleTrigerUpload} disabled={enviandoFoto} className="flex items-center gap-2.5 bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 text-sm shadow-md">{enviandoFoto ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Upload size={18} />}{enviandoFoto ? 'Importando...' : 'Importar Imagem'}</button>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4 relative z-10">
                    {pacienteDetalhado.fotos.length === 0 && !isDraggingOver && (
                        <div className="col-span-full border-2 border-dashed border-slate-200 rounded-2xl py-10 text-center text-slate-400 flex flex-col items-center gap-3"><ImageIcon size={40} className="opacity-40"/><p className="font-medium">Nenhuma imagem.<br/>Arraste uma foto ou clique em Importar.</p></div>
                    )}
                    {pacienteDetalhado.fotos.map(foto => (
                        <div key={foto.id} className="relative group aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 shadow-sm bg-white cursor-pointer" onClick={() => setFotoEnlarged(foto.url)}>
                            <img src={foto.url} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><ZoomIn className="text-white" size={24} /></div>
                            <button onClick={(e) => { e.stopPropagation(); deletarFoto(foto.id); }} className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 hover:scale-110 shadow-lg z-10" title="Excluir"><Trash2 size={16} /></button>
                        </div>
                    ))}
                  </div>
                </section>

                <section>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3"><FileText className="text-blue-600" size={28} /> Anotações Clínicas</h3>
                    <button onClick={salvarObservacoes} disabled={salvandoNotas} className="flex items-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 text-sm shadow-md">{salvandoNotas ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Save size={18} />}{salvandoNotas ? 'Salvando...' : 'Salvar Notas'}</button>
                  </div>
                  <textarea value={observacoesDraft} onChange={e => setObservacoesDraft(e.target.value)} rows={10} placeholder="Histórico médico, alergias, planejamento..." className="w-full p-8 bg-white border border-slate-200 rounded-3xl outline-none focus:ring-4 focus:ring-emerald-100 font-medium text-slate-700 resize-none text-lg shadow-inner custom-scrollbar" />
                </section>
              </div>

              <aside className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
                  <h3 className="text-2xl font-bold text-slate-900 flex items-center gap-3 mb-8"><Calendar className="text-blue-600" size={28} /> Linha do Tempo</h3>
                  <div className="space-y-6 relative before:absolute before:inset-y-0 before:left-4 before:w-0.5 before:bg-slate-200">
                    {pacienteDetalhado.agendamentos.length === 0 && <p className="text-slate-500 pl-10 pt-2 font-medium">Sem procedimentos registrados.</p>}
                    {[...pacienteDetalhado.agendamentos].sort((a, b) => new Date(b.data_inicio).getTime() - new Date(a.data_inicio).getTime()).map((ag) => {
                        const data = new Date(ag.data_inicio);
                        const config = statusConfig[ag.status] || statusConfig['DEFAULT'];
                        return (
                          <div key={ag.id} className="relative pl-12">
                            <div className="absolute left-0 top-1 w-8 h-8 bg-white border-2 border-blue-600 rounded-full flex items-center justify-center z-10 shadow-md"><CheckCircle size={16} className="text-blue-600" /></div>
                            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:border-blue-100 transition-colors relative group">
                                <div className={`absolute top-4 right-4 px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${config.cor}`}>{ag.status}</div>
                                <div className="pr-16">
                                  <p className="font-bold text-slate-800 text-base leading-tight group-hover:text-blue-600 transition-colors">{ag.servico.nome}</p>
                                  <p className="text-sm text-blue-600 font-semibold mt-1">{data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}, {data.getFullYear()}</p>
                                </div>
                            </div>
                          </div>
                        );
                    })}
                  </div>
              </aside>
            </div>
          </div>
        </div>
      )}

      {fotoEnlarged && (
          <div className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 transition-opacity" onClick={() => setFotoEnlarged(null)}>
              <button className="absolute top-6 right-6 text-white/70 hover:text-white hover:rotate-90 transform transition-all"><X size={32} /></button>
              <img src={fotoEnlarged} className="max-w-full max-h-full rounded-2xl shadow-2xl scale-in" onClick={e => e.stopPropagation()}/>
          </div>
      )}
    </div>
  );
}