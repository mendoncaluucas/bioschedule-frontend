import axios from 'axios';

export const api = axios.create({
  // Tenta ler da Vercel primeiro, se não existir (no seu PC), usa o localhost
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// "Interceptor": Antes de qualquer requisição sair do React para o NestJS, ele faz isso:
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('@BioSchedule:token');
  
  if (token) {
    // Coloca o crachá JWT no formato "Bearer token..."
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Interceptor de RESPOSTA: Se o token expirar, redireciona pro Login automaticamente
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('@BioSchedule:token');
      localStorage.removeItem('@BioSchedule:user');
      // Redireciona para login se não estiver já na tela de login ou na tela pública
      if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/agendar')) {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);