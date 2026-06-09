import { useState, useEffect, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { 
  Smartphone, Wifi, WifiOff, RefreshCw, 
  CheckCircle, QrCode, AlertCircle, Loader2 
} from 'lucide-react';

export function WhatsApp() {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await api.get('/whatsapp/qr');
      setConnected(res.data.connected);
      setQrCode(res.data.qr);
      setError(null);

      if (res.data.connected) {
        setLoading(false);
      }
    } catch (err: any) {
      setError('Não foi possível conectar ao servidor.');
      setLoading(false);
    }
  }, []);

  // Polling: busca QR/status a cada 3s enquanto não estiver conectado
  useEffect(() => {
    fetchStatus(); // Primeira chamada imediata

    const interval = setInterval(() => {
      if (!connected) {
        fetchStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [connected, fetchStatus]);

  // Ao receber QR ou conexão, para de mostrar loading
  useEffect(() => {
    if (qrCode || connected) {
      setLoading(false);
    }
  }, [qrCode, connected]);

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <header className="mb-10 animate-slide-up">
        <h1 className="text-4xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <Smartphone className="text-emerald-600" size={36} /> WhatsApp
        </h1>
        <p className="text-slate-500 font-medium mt-2">
          Gerencie a conexão do WhatsApp para envio automático de confirmações e lembretes.
        </p>
      </header>

      {/* Card de Status */}
      <div className={`rounded-[2rem] shadow-sm border p-8 mb-8 animate-slide-up delay-100 transition-all ${
        connected 
          ? 'bg-emerald-50 border-emerald-200' 
          : 'bg-white border-slate-100'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-md ${
              connected ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
              {connected ? <Wifi size={28} /> : <WifiOff size={28} />}
            </div>
            <div>
              <h2 className={`text-xl font-black ${connected ? 'text-emerald-700' : 'text-slate-700'}`}>
                {connected ? 'Conectado' : 'Desconectado'}
              </h2>
              <p className={`text-sm font-medium ${connected ? 'text-emerald-600' : 'text-slate-400'}`}>
                {connected 
                  ? 'WhatsApp pronto para enviar mensagens automáticas.'
                  : 'Escaneie o QR Code abaixo para conectar.'
                }
              </p>
            </div>
          </div>

          {connected && (
            <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl">
              <CheckCircle size={18} />
              <span className="font-bold text-sm">Ativo</span>
            </div>
          )}
        </div>
      </div>

      {/* QR Code ou Mensagem */}
      {!connected && (
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-10 animate-slide-up delay-200">
          <div className="flex flex-col lg:flex-row items-center gap-10">
            
            {/* QR Code */}
            <div className="flex flex-col items-center">
              {loading ? (
                <div className="w-72 h-72 bg-slate-50 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-slate-200">
                  <Loader2 size={48} className="text-blue-500 animate-spin mb-4" />
                  <p className="text-slate-400 font-bold text-sm">Aguardando QR Code...</p>
                </div>
              ) : error ? (
                <div className="w-72 h-72 bg-rose-50 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-rose-200 p-6">
                  <AlertCircle size={48} className="text-rose-400 mb-4" />
                  <p className="text-rose-500 font-bold text-sm text-center">{error}</p>
                  <button 
                    onClick={() => { setLoading(true); setError(null); fetchStatus(); }}
                    className="mt-4 flex items-center gap-2 text-sm font-bold text-rose-600 hover:text-rose-700"
                  >
                    <RefreshCw size={16} /> Tentar novamente
                  </button>
                </div>
              ) : qrCode ? (
                <div className="bg-white p-6 rounded-3xl shadow-lg shadow-slate-200/50 border border-slate-100">
                  <QRCodeSVG 
                    value={qrCode} 
                    size={256} 
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#0f172a"
                  />
                </div>
              ) : (
                <div className="w-72 h-72 bg-amber-50 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-amber-200 p-6">
                  <QrCode size={48} className="text-amber-400 mb-4" />
                  <p className="text-amber-600 font-bold text-sm text-center">
                    Aguardando geração do QR Code pelo servidor...
                  </p>
                </div>
              )}
            </div>

            {/* Instruções */}
            <div className="flex-1 max-w-md">
              <h3 className="text-2xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <QrCode className="text-blue-600" size={24} />
                Como conectar
              </h3>
              <ol className="space-y-5">
                <li className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm shrink-0">1</div>
                  <div>
                    <p className="font-bold text-slate-700">Abra o WhatsApp</p>
                    <p className="text-slate-400 text-sm font-medium">No celular da clínica</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm shrink-0">2</div>
                  <div>
                    <p className="font-bold text-slate-700">Vá em "Aparelhos conectados"</p>
                    <p className="text-slate-400 text-sm font-medium">Menu ⋮ → Aparelhos conectados → Conectar um aparelho</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center font-black text-sm shrink-0">3</div>
                  <div>
                    <p className="font-bold text-slate-700">Escaneie o QR Code</p>
                    <p className="text-slate-400 text-sm font-medium">Aponte a câmera para o código ao lado</p>
                  </div>
                </li>
              </ol>

              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <p className="text-amber-700 text-sm font-medium flex items-start gap-2">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>O QR Code expira rapidamente. Se não funcionar, aguarde a geração de um novo automaticamente.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Card de funcionalidades quando conectado */}
      {connected && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up delay-200">
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle size={24} />
            </div>
            <h3 className="font-black text-slate-800 text-lg mb-2">Confirmação Automática</h3>
            <p className="text-slate-400 font-medium text-sm">
              Quando um paciente agendar online, ele receberá automaticamente uma mensagem de confirmação no WhatsApp com os detalhes do agendamento.
            </p>
          </div>
          <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-8">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mb-4">
              <Smartphone size={24} />
            </div>
            <h3 className="font-black text-slate-800 text-lg mb-2">Lembretes Diários</h3>
            <p className="text-slate-400 font-medium text-sm">
              Todo dia às 08:00, o sistema envia lembretes automáticos para os pacientes que possuem agendamentos para o dia seguinte.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
