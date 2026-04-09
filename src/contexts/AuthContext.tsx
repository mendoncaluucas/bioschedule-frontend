import { createContext, useState, useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { api } from '../services/api'; // Importamos nossa API

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('@BioSchedule:token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  async function login(email: string, senha: string) {
    try {
      const response = await api.post('/auth/login', { 
        email, 
        senha 
      });

      // ✨ A MÁGICA: Agora extraímos o access_token E o usuario
      const { access_token, usuario } = response.data; 

      if (access_token) {
        localStorage.setItem('@BioSchedule:token', access_token);
        
        // ✨ Salvamos o usuário no formato JSON para as outras telas lerem
        if (usuario) {
          localStorage.setItem('@BioSchedule:user', JSON.stringify(usuario));
        }

        setIsAuthenticated(true);
        navigate('/dashboard');
      }

    } catch (error: any) {
      console.error(error.response?.data);
      Swal.fire({
        icon: 'error',
        title: 'Acesso Negado',
        text: error.response?.data?.message || 'E-mail ou senha incorretos.',
        customClass: { popup: 'rounded-[2rem]' }
      });
    }
  }

  function logout() {
    // ✨ Limpamos as duas chaves para não deixar rastros
    localStorage.removeItem('@BioSchedule:token');
    localStorage.removeItem('@BioSchedule:user');
    setIsAuthenticated(false);
    navigate('/');
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}