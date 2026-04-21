import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Sparkles, Plus, Search, Clock, DollarSign, Edit2, Trash2, X, Check } from 'lucide-react';
import Swal from 'sweetalert2';

interface Servico {
  id: string;
  nome: string;
  valor: number;
  duracao_minutos: number;
}

export function Servicos() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);

  // --- ESTADOS DO MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formData, setFormData] = useState({
    id: '', nome: '', valor: '', duracao_minutos: ''
  });

  useEffect(() => { carregarServicos(); }, []);

  async function carregarServicos() {
    try {
      setCarregando(true);
      const response = await api.get('/servicos'); // ✨ CORRIGIDO: /servicos
      setServicos(response.data);
    } catch (error) {
      Swal.fire('Erro', 'Não foi possível carregar os procedimentos.', 'error');
    } finally { setCarregando(false); }
  }

  function abrirModalNovo() {
    setFormData({ id: '', nome: '', valor: '', duracao_minutos: '' });
    setIsModalOpen(true);
  }

  function abrirModalEditar(s: Servico) {
    setFormData({ 
      id: s.id, 
      nome: s.nome, 
      valor: s.valor.toString(), 
      duracao_minutos: s.duracao_minutos.toString() 
    });
    setIsModalOpen(true);
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSalvando(true);
      const payload = {
        nome: formData.nome,
        valor: Number(formData.valor),
        duracao_minutos: Number(formData.duracao_minutos)
      };

      if (formData.id) {
        await api.patch(`/servicos/${formData.id}`, payload); // ✨ CORRIGIDO: /servicos e PATCH (o controller usa Patch)
        Swal.fire({ icon: 'success', title: 'Atualizado!', timer: 1500, showConfirmButton: false });
      } else {
        await api.post('/servicos', payload); // ✨ CORRIGIDO: /servicos
        Swal.fire({ icon: 'success', title: 'Cadastrado!', timer: 1500, showConfirmButton: false });
      }
      
      setIsModalOpen(false);
      carregarServicos();
    } catch (error) {
      Swal.fire('Erro', 'Não foi possível salvar.', 'error');
    } finally {
      setSalvando(false);
    }
  }

  async function deletarServico(id: string, nome: string) {
    const confirmar = await Swal.fire({ 
      title: 'Excluir procedimento?', 
      text: `Deseja realmente apagar "${nome}"?`, 
      icon: 'warning', showCancelButton: true, confirmButtonColor: '#e11d48', confirmButtonText: 'Sim, excluir!' 
    });

    if (confirmar.isConfirmed) {
      try {
        await api.delete(`/servicos/${id}`); // ✨ CORRIGIDO: /servicos
        setServicos(servicos.filter(s => s.id !== id));
        Swal.fire({ icon: 'success', title: 'Excluído!', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      } catch (error) { 
        Swal.fire('Erro', 'Não foi possível excluir. Pode estar vinculado a um agendamento.', 'error'); 
      }
    }
  }

  const servicosFiltrados = servicos.filter(s => s.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <header className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 animate-slide-up">
        <div>
          <h1 className="text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
            <Sparkles className="text-blue-600" size={36} /> Procedimentos
          </h1>
          <p className="text-slate-500 font-medium mt-2">Catálogo de serviços e valores da clínica.</p>
        </div>
        <button 
          onClick={abrirModalNovo}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 w-full sm:w-auto justify-center"
        >
          <Plus size={20} /> Novo Procedimento
        </button>
      </header>

      <div className="relative mb-8 animate-slide-up delay-100">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
        <input 
          type="text" value={busca} onChange={e => setBusca(e.target.value)}
          placeholder="Buscar procedimento..."
          className="w-full p-5 pl-14 bg-white border border-slate-100 rounded-[2rem] outline-none focus:ring-2 focus:ring-blue-200 text-lg shadow-sm"
        />
      </div>

      {carregando ? (
        <div className="p-20 text-center text-slate-500 flex flex-col items-center gap-4 animate-slide-up delay-200">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div> Carregando...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicosFiltrados.map((s, index) => {
            const delayClass = `delay-${Math.min((index % 5 + 2) * 100, 500)}`;
            
            return (
              <div key={s.id} className={`bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col animate-slide-up ${delayClass}`}>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shadow-inner group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Sparkles size={24} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => abrirModalEditar(s)} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-blue-100 hover:text-blue-700 transition-colors"><Edit2 size={16}/></button>
                    <button onClick={() => deletarServico(s.id, s.nome)} className="p-2 bg-slate-50 text-slate-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-colors"><Trash2 size={16}/></button>
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 mb-4 line-clamp-2">{s.nome}</h3>
                
                <div className="mt-auto space-y-3 pt-4 border-t border-slate-50">
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span className="flex items-center gap-2"><Clock size={18} className="text-slate-400"/> Duração</span>
                    <span>{s.duracao_minutos} min</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-600 font-medium">
                    <span className="flex items-center gap-2"><DollarSign size={18} className="text-blue-500"/> Valor</span>
                    <span className="font-black text-blue-600 text-lg">
                      R$ {Number(s.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {servicosFiltrados.length === 0 && (
            <div className="col-span-full p-20 text-center text-slate-400 bg-white rounded-[2rem] border border-slate-100 border-dashed">
              <Sparkles size={48} className="mx-auto mb-4 opacity-30 text-blue-500" />
              <p className="text-xl font-medium">Nenhum procedimento encontrado.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL NOVO/EDITAR PROCEDIMENTO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl scale-in">
            <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                <Sparkles className="text-blue-600" /> {formData.id ? 'Editar Procedimento' : 'Novo Procedimento'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500 p-2 bg-slate-50 rounded-full transition-colors"><X size={18} /></button>
            </div>

            <form onSubmit={handleSalvar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nome do Procedimento</label>
                <input required autoFocus type="text" value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Duração (minutos)</label>
                  <input required type="number" min="5" step="5" value={formData.duracao_minutos} onChange={e => setFormData({...formData, duracao_minutos: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Valor (R$)</label>
                  <input required type="number" min="0" step="0.01" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium" />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" disabled={salvando || !formData.nome} className="w-full bg-blue-600 text-white font-bold text-base px-6 py-3.5 rounded-xl hover:bg-blue-700 transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2">
                  {salvando ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Check size={18} />}
                  {salvando ? 'Salvando...' : 'Salvar Procedimento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}