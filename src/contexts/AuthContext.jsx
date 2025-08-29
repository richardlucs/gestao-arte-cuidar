import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';

const defaultUsers = [
  { id: '1', name: 'Administrador Teste', email: 'administrador@teste.com', phone: '11999999999', password: '1234', role: 'administrador' },
  { id: '2', name: 'Supervisor Teste', email: 'supervisor@teste.com', phone: '11999999998', password: '1234', role: 'supervisor' },
  { id: '3', name: 'Cuidador Teste', email: 'cuidador@teste.com', phone: '11999999997', password: '1234', role: 'cuidador' }
];

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('arte_cuidar_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      let allUsers = localStorage.getItem('arte_cuidar_users');
      if (!allUsers || JSON.parse(allUsers).length === 0) {
        localStorage.setItem('arte_cuidar_users', JSON.stringify(defaultUsers));
      }

    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('arte_cuidar_user');
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (loginData) => {
    const { identity, password } = loginData;
    
    let users = JSON.parse(localStorage.getItem('arte_cuidar_users')) || defaultUsers;
    
    const foundUser = users.find(
      u => (u.email === identity || u.phone === identity) && u.password === password
    );

    if (foundUser) {
      const userToStore = { 
        id: foundUser.id, 
        name: foundUser.name, 
        email: foundUser.email,
        phone: foundUser.phone, 
        role: foundUser.role,
        password: foundUser.password // WARNING: Storing password in user context is not secure. For demo only.
      };
      localStorage.setItem('arte_cuidar_user', JSON.stringify(userToStore));
      setUser(userToStore);
      toast({ title: "Login realizado com sucesso!", description: `Bem-vindo(a), ${foundUser.name}!` });
      return userToStore;
    } else {
      toast({ title: "Erro de login", description: "E-mail/telefone ou senha inválidos.", variant: "destructive" });
      return null;
    }
  };

  const signUp = async (userData) => {
    let users = JSON.parse(localStorage.getItem('arte_cuidar_users')) || defaultUsers;

    const existingUser = users.some(u => u.email === userData.email || u.phone === userData.phone);
    if (existingUser) {
        toast({ title: "Erro no Cadastro", description: "E-mail ou telefone já cadastrado.", variant: "destructive" });
        return { user: null, error: new Error("User already exists.") };
    }

    const newUser = {
        id: Date.now().toString(),
        ...userData
    };

    users.push(newUser);
    localStorage.setItem('arte_cuidar_users', JSON.stringify(users));
    
    return { user: newUser, error: null };
  };

  const logout = () => {
    localStorage.removeItem('arte_cuidar_user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    logout,
    signUp,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}