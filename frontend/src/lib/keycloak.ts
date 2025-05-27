import Keycloak from 'keycloak-js';

// Khởi tạo Keycloak
const keycloakConfig = {
  url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || 'http://localhost:8080',
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'gradeview',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'gradeview-backend'
};

// Always create a fresh instance to avoid initialization issues
export const initKeycloak = () => {
  if (typeof window !== 'undefined') {
    console.log('Initializing Keycloak with config:', keycloakConfig);
    return new Keycloak(keycloakConfig);
  }
  return null;
};

// Hàm để xử lý đăng nhập
export const login = async (redirectUri?: string) => {
  const kc = initKeycloak();
  if (kc) {
    try {
      await kc.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
        pkceMethod: 'S256', // Sử dụng PKCE cho bảo mật
      });
      
      if (!kc.authenticated) {
        await kc.login({
          redirectUri: redirectUri || window.location.origin
        });
      }
      
      return kc;
    } catch (error) {
      console.error('Keycloak initialization error:', error);
      throw error;
    }
  }
  throw new Error('Keycloak not available');
};

// Hàm để xử lý đăng xuất
export const logout = async () => {
  const kc = initKeycloak();
  if (kc) {
    try {
      await kc.init({
        onLoad: 'check-sso',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html',
      });
      
      if (kc.authenticated) {
        await kc.logout({
          redirectUri: window.location.origin
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }
};

// Hàm để lấy token
export const getToken = () => {
  const kc = initKeycloak();
  if (kc) {
    try {
      return kc.token;
    } catch (error) {
      console.error('Get token error:', error);
      return undefined;
    }
  }
  return undefined;
};

// Hàm để kiểm tra vai trò
export const hasRole = (role: string) => {
  const kc = initKeycloak();
  if (kc) {
    try {
      return kc.hasRealmRole(role) || false;
    } catch (error) {
      console.error('Check role error:', error);
      return false;
    }
  }
  return false;
};

export default initKeycloak; 