"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { initKeycloak, login, logout, getToken, hasRole } from '@/lib/keycloak';
import Keycloak from 'keycloak-js';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: any;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  token: string | undefined;
  keycloak: Keycloak | null;
}

const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => { throw new Error('AuthContext not initialized'); },
  logout: async () => { throw new Error('AuthContext not initialized'); },
  hasRole: () => false,
  token: undefined,
  keycloak: null,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [keycloak, setKeycloak] = useState<Keycloak | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | undefined>(undefined);

  // Initialize Keycloak on client side only
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const initAuth = async () => {
        try {
          const kc = initKeycloak();
          if (kc) {
            await kc.init({
              onLoad: 'check-sso',
              silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
              pkceMethod: 'S256',
            });
            
            setKeycloak(kc);
            setIsAuthenticated(kc.authenticated || false);
            setToken(kc.token);
            
            if (kc.authenticated) {
              // Get user profile if authenticated
              const userProfile = await kc.loadUserProfile();
              
              // Get user roles from Keycloak token
              let role = 'student'; // default role
              
              if (kc.hasRealmRole('admin')) {
                role = 'admin';
              } else if (kc.hasRealmRole('teacher')) {
                role = 'teacher';
              } else if (kc.hasRealmRole('student')) {
                role = 'student';
              }
              
              // Set user with role information
              setUser({
                ...userProfile,
                // Lưu Keycloak ID trong trường riêng, nhưng không dùng làm id chính
                keycloakId: userProfile.id,
                // Sẽ được cập nhật với database ID sau khi kiểm tra backend
                id: null,
                name: userProfile.firstName 
                  ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() 
                  : userProfile.username,
                email: userProfile.email,
                role: role
              });
              
              console.log('Người dùng đã xác thực với vai trò:', role);
              console.log('Thông tin người dùng từ Keycloak:', userProfile);
              
              // Đồng bộ thông tin người dùng với backend
              try {
                // Trước tiên kiểm tra xem người dùng đã tồn tại trong hệ thống chưa
                const backendUserResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users/keycloak/${userProfile.id}`, {
                  headers: {
                    'Authorization': `Bearer ${kc.token}`
                  }
                });
                
                if (backendUserResponse.status === 404) {
                  // Người dùng chưa tồn tại trong backend, tạo mới
                  console.log('Không tìm thấy người dùng trong backend, tạo người dùng mới');
                  
                  const createResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${kc.token}`
                    },
                    body: JSON.stringify({
                      keycloakId: userProfile.id,
                      name: userProfile.firstName 
                        ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() 
                        : userProfile.username,
                      email: userProfile.email,
                      role: role
                    })
                  });
                  
                  if (createResponse.ok) {
                    const newUser = await createResponse.json();
                    console.log('Tạo người dùng trong backend:', newUser);
                    
                    // Cập nhật user state với database ID
                    setUser((prevUser: any) => ({
                      ...prevUser,
                      id: newUser.id
                    }));
                  } else {
                    // Thêm xử lý lỗi chi tiết hơn
                    const errorData = await createResponse.text();
                    console.error('Không thể tạo người dùng trong backend. Status:', createResponse.status);
                    console.error('Chi tiết lỗi:', errorData);
                    
                    // Thử lại một lần nữa với một số thông tin debug
                    console.log('Thử lại tạo người dùng với thông tin debug...');
                    const retryResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${kc.token}`,
                        'X-Debug': 'true'
                      },
                      body: JSON.stringify({
                        keycloakId: userProfile.id,
                        name: userProfile.firstName 
                          ? `${userProfile.firstName} ${userProfile.lastName || ''}`.trim() 
                          : userProfile.username,
                        email: userProfile.email,
                        role: role
                      })
                    });
                    
                    if (retryResponse.ok) {
                      const newUser = await retryResponse.json();
                      console.log('Người dùng đã được tạo lại:', newUser);
                      setUser((prevUser: any) => ({ ...prevUser, id: newUser.id }));
                    } else {
                      console.error('Thử lại không thành công. Status:', retryResponse.status);
                      throw new Error('Không thể tạo người dùng trong backend');
                    }
                  }
                } else if (backendUserResponse.ok) {
                  // Người dùng đã tồn tại, lấy thông tin từ backend
                  const backendUser = await backendUserResponse.json();
                  console.log('Tìm thấy người dùng trong backend:', backendUser);
                  
                  // Cập nhật user state với database ID
                  setUser((prevUser: any) => ({
                    ...prevUser,
                    id: backendUser.id,
                    name: backendUser.name || prevUser.name
                  }));
                }
              } catch (syncError) {
                console.error('Lỗi đồng bộ hóa người dùng với backend:', syncError);
              }
            }
            
            // Set up token refresh
            kc.onTokenExpired = () => {
              console.log('Token hết hạn, tải lại...');
              kc.updateToken(30).then((refreshed) => {
                if (refreshed) {
                  console.log('Token đã được tải lại');
                  setToken(kc.token);
                }
              }).catch(() => {
                console.log('Không thể tải lại token, đăng xuất...');
                handleLogout();
              });
            };
          }
        } catch (error) {
          console.error('Không thể khởi tạo xác thực:', error);
        } finally {
          setIsLoading(false);
        }
      };
      
      initAuth();
    }
  }, []);

  const handleLogin = async () => {
    try {
      await login();
    } catch (error) {
      console.error('Lỗi đăng nhập:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Reset local state
      setIsAuthenticated(false);
      setUser(null);
      setToken(undefined);
    } catch (error) {
      console.error('Lỗi đăng xuất:', error);
      throw error;
    }
  };

  const checkRole = (role: string) => {
    return hasRole(role);
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    user,
    login: handleLogin,
    logout: handleLogout,
    hasRole: checkRole,
    token,
    keycloak,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
