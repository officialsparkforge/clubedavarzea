import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

// Mock users database - inicial
const INITIAL_USERS = {
  'admin@clubevarzea.com': {
    email: 'admin@clubevarzea.com',
    password: 'admin123',
    name: 'Administrador Master',
    role: 'admin',
    id: 'admin-001',
    avatar: '👨‍💼',
  },
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [users, setUsers] = useState(() => {
    const savedUsers = localStorage.getItem('clubevarzea_users');
    return savedUsers ? JSON.parse(savedUsers) : INITIAL_USERS;
  });

  // Salvar usuários no localStorage quando mudarem
  useEffect(() => {
    localStorage.setItem('clubevarzea_users', JSON.stringify(users));
  }, [users]);

  // Initialize auth from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('clubevarzea_user');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('clubevarzea_user');
      }
    }
  }, []);

  const login = async (email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockUser = users[email];
      
      if (!mockUser || mockUser.password !== password) {
        throw new Error('Email ou senha inválidos');
      }

      const userData = {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        avatar: mockUser.avatar,
      };

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('clubevarzea_user', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      setAuthError(error.message);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = async (name, email, password) => {
    setIsLoadingAuth(true);
    setAuthError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (users[email]) {
        throw new Error('Este email já está registrado');
      }

      if (password.length < 6) {
        throw new Error('Senha deve ter no mínimo 6 caracteres');
      }

      const newUserId = 'user-' + Date.now().toString();
      const newUser = {
        email,
        password,
        name,
        role: 'customer',
        id: newUserId,
        avatar: '👤',
      };

      // Adicionar novo usuário à lista
      setUsers({ ...users, [email]: newUser });

      const userData = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        avatar: newUser.avatar,
      };

      setUser(userData);
      setIsAuthenticated(true);
      localStorage.setItem('clubevarzea_user', JSON.stringify(userData));
      
      return userData;
    } catch (error) {
      setAuthError(error.message);
      setIsAuthenticated(false);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const changePassword = async (email, currentPassword, newPassword) => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      if (!email) {
        throw new Error('Email nao informado');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new Error('Senha deve ter no minimo 6 caracteres');
      }

      const existingUser = users[email];
      if (!existingUser) {
        throw new Error('Usuario nao encontrado');
      }

      if (existingUser.password !== currentPassword) {
        throw new Error('Senha atual incorreta');
      }

      if (currentPassword === newPassword) {
        throw new Error('A nova senha deve ser diferente da atual');
      }

      setUsers({
        ...users,
        [email]: {
          ...existingUser,
          password: newPassword,
        },
      });

      return true;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const resetPassword = async (email, newPassword) => {
    setIsLoadingAuth(true);
    setAuthError(null);

    try {
      await new Promise(resolve => setTimeout(resolve, 400));

      if (!email) {
        throw new Error('Email nao informado');
      }

      if (!newPassword || newPassword.length < 6) {
        throw new Error('Senha deve ter no minimo 6 caracteres');
      }

      const existingUser = users[email];
      if (!existingUser) {
        throw new Error('Usuario nao encontrado');
      }

      setUsers({
        ...users,
        [email]: {
          ...existingUser,
          password: newPassword,
        },
      });

      return true;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('clubevarzea_user');
  };

  const isAdmin = () => user?.role === 'admin';

  const navigateToLogin = () => {
    console.log('Navigate to login');
  };

  const checkAppState = () => {
    // Mock implementation
  };

  const value = {
    user,
    isAuthenticated,
    isLoadingAuth,
    isLoadingPublicSettings,
    authError,
    appPublicSettings,
    login,
    register,
    logout,
    isAdmin,
    changePassword,
    resetPassword,
    navigateToLogin,
    checkAppState,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
