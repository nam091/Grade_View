import Keycloak from 'keycloak-connect';
import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';

dotenv.config();

// Configure Keycloak
// Note: Keycloak 21+ uses /realms instead of /auth/realms path
const keycloakConfig = {
  realm: process.env.KEYCLOAK_REALM || 'gradeview',
  'auth-server-url': 'http://localhost:8080', // Hard-code localhost URL
  'ssl-required': 'external',
  resource: process.env.KEYCLOAK_CLIENT_ID || 'gradeview-backend',
  'confidential-port': 0,
  'bearer-only': true
};

// Initialize Keycloak
let _keycloak: Keycloak.Keycloak;

export const initKeycloak = (memoryStore: any): Keycloak.Keycloak => {
  if (_keycloak) {
    console.log('Returning existing Keycloak instance');
    return _keycloak;
  }
  
  console.log('Initializing Keycloak...');
  console.log('Using Keycloak config:', JSON.stringify(keycloakConfig, null, 2));
  
  _keycloak = new Keycloak({ store: memoryStore }, keycloakConfig);
  return _keycloak;
};

export const getKeycloak = (): Keycloak.Keycloak => {
  if (!_keycloak) {
    throw new Error('Keycloak chưa được khởi tạo. Vui lòng gọi initKeycloak trước.');
  }
  return _keycloak;
};

// Role-based access control middleware using Keycloak's built-in protect function
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // Use Keycloak's built-in protect function with the role
      getKeycloak().protect(role)(req, res, (err: any) => {
        if (err) {
          return res.status(403).json({ message: `Truy cập bị từ chối: Vai trò '${role}' bắt buộc` });
        }
        next();
      });
    } catch (error: any) {
      console.error('Lỗi trong việc xác thực vai trò:', error);
      return res.status(401).json({ message: 'Lỗi xác thực', details: error.message });
    }
  };
};

// Middleware to protect all routes without specific role requirement
export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    getKeycloak().protect()(req, res, (err: any) => {
      if (err) {
        return res.status(401).json({ message: 'Yêu cầu xác thực' });
      }
      next();
    });
  } catch (error: any) {
    console.error('Lỗi trong việc xác thực:', error);
    return res.status(401).json({ message: 'Lỗi xác thực', details: error.message });
  }
}; 