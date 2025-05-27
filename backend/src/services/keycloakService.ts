import axios from 'axios';

// Cấu hình Keycloak từ biến môi trường
const keycloakConfig = {
  baseUrl: process.env.KEYCLOAK_SERVER_URL || 'http://localhost:8080', // Lấy URL từ biến môi trường nếu có
  realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || 'gradeview',
  clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || 'gradeview-frontend',
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET || 'g8ldPzzKLhS9lhVAxtb0l64Hv38bF94X' // Thêm fallback cho client secret
};

/**
 * Service tương tác với Keycloak Admin API
 */
class KeycloakService {
  private adminToken: string | null = null;
  private tokenExpiry: number = 0;

  /**
   * Lấy token admin để gọi API Keycloak
   */
  private async getAdminToken(): Promise<string> {
    if (this.adminToken && Date.now() < this.tokenExpiry) {
      return this.adminToken;
    }

    try {
      console.log(`Kết nối đến Keycloak tại ${keycloakConfig.baseUrl}`);
      console.log('Sử dụng client admin-cli để xác thực');
      
      // Thử sử dụng mật khẩu admin thay vì client credentials
      const response = await axios.post(
        `${keycloakConfig.baseUrl}/realms/master/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'password',
          client_id: 'admin-cli',
          username: process.env.KEYCLOAK_ADMIN || 'admin',
          password: process.env.KEYCLOAK_ADMIN_PASSWORD || 'admin',
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 5000, // Set timeout to 5 seconds
        }
      );

      console.log('Đã xác thực thành công với Keycloak Admin');
      
      this.adminToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      return this.adminToken as string;
    } catch (error: any) {
      console.error('Không thể lấy token admin Keycloak:', error.message);
      if (error.response) {
        console.error('Dữ liệu phản hồi:', error.response.data);
        console.error('Mã trạng thái:', error.response.status);
      } else if (error.request) {
        console.error('Lỗi mạng: Không nhận được phản hồi từ máy chủ Keycloak');
        console.error('Chi tiết yêu cầu:', error.request._currentUrl);
      } else {
        console.error('Chi tiết lỗi:', error.message);
      }
      throw new Error(`Không thể xác thực với Keycloak Admin: ${error.message}`);
    }
  }

  /**
   * Tạo user mới trong Keycloak
   */
  async createUser(userData: {
    username: string;
    email: string;
    firstName: string;
    lastName?: string;
    password: string;
    role: string;
  }): Promise<string> {
    try {
      console.log('Tạo người dùng trong Keycloak với dữ liệu:', { 
        ...userData, 
        password: '******' // Hide password in logs
      });
      
      const token = await this.getAdminToken();
      console.log('Đã lấy token admin, tiếp tục tạo người dùng:', userData.username);
      
      // Tạo user trong Keycloak
      const userResponse = await axios.post(
        `${keycloakConfig.baseUrl}/admin/realms/${keycloakConfig.realm}/users`,
        {
          username: userData.username,
          email: userData.email,
          firstName: userData.firstName || userData.username,
          lastName: userData.lastName || '',
          enabled: true,
          emailVerified: true,
          credentials: [
            {
              type: 'password',
              value: userData.password,
              temporary: false,
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 5000, // Set timeout to 5 seconds
        }
      );
      
      // Lấy ID của user vừa tạo
      const location = userResponse.headers.location;
      if (!location) {
        console.error('Không có header location trong phản hồi');
        throw new Error('Không thể lấy ID người dùng mới từ Keycloak');
      }
      
      const userId = location.substring(location.lastIndexOf('/') + 1);
      console.log(`Người dùng đã được tạo với ID: ${userId}`);
      
      // Gán role cho user
      await this.assignRoleToUser(userId, userData.role);
      
      return userId;
    } catch (error: any) {
      console.error('Không thể tạo người dùng Keycloak:', error.message);
      if (error.response) {
        console.error('Dữ liệu phản hồi:', error.response.data);
        console.error('Mã trạng thái:', error.response.status);
      } else if (error.request) {
        console.error('Lỗi mạng: Không nhận được phản hồi từ máy chủ Keycloak');
        console.error('Yêu cầu chi tiết:', error.request._currentUrl);
        throw new Error(`Không thể kết nối đến máy chủ Keycloak tại ${keycloakConfig.baseUrl}. Có phải Keycloak đang chạy không?`);
      } else {
        console.error('Chi tiết lỗi:', error.message);
      }
      throw new Error(`Không thể tạo người dùng trong Keycloak: ${error.message}`);
    }
  }

  /**
   * Xóa user khỏi Keycloak
   */
  async deleteUser(keycloakId: string): Promise<void> {
    try {
      const token = await this.getAdminToken();
      console.log(`Xóa người dùng khỏi Keycloak: ${keycloakId}`);
      
      // Xóa user từ Keycloak
      await axios.delete(
        `${keycloakConfig.baseUrl}/admin/realms/${keycloakConfig.realm}/users/${keycloakId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log(`Đã xóa người dùng khỏi Keycloak: ${keycloakId}`);
    } catch (error: any) {
      console.error(`Không thể xóa người dùng khỏi Keycloak: ${keycloakId}`);
      if (error.response) {
        console.error('Dữ liệu phản hồi:', error.response.data);
        console.error('Mã trạng thái:', error.response.status);
      }
      throw new Error(`Không thể xóa người dùng trong Keycloak: ${error.message}`);
    }
  }

  /**
   * Gán role cho user
   */
  private async assignRoleToUser(userId: string, role: string): Promise<void> {
    try {
      const token = await this.getAdminToken();
      console.log(`Gán vai trò ${role} cho người dùng ${userId}`);
      
      // Lấy thông tin role
      const rolesResponse = await axios.get(
        `${keycloakConfig.baseUrl}/admin/realms/${keycloakConfig.realm}/roles`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const roles = rolesResponse.data;
      console.log('Các vai trò có sẵn:', roles.map((r: any) => r.name));
      
      const targetRole = roles.find((r: any) => r.name === role);
      
      if (!targetRole) {
        console.error(`Vai trò ${role} không tồn tại trong các vai trò có sẵn`);
        throw new Error(`Vai trò ${role} không tồn tại`);
      }
      
      console.log(`Tìm thấy vai trò ${targetRole.name} với ID ${targetRole.id}`);
      
      // Gán role cho user
      await axios.post(
        `${keycloakConfig.baseUrl}/admin/realms/${keycloakConfig.realm}/users/${userId}/role-mappings/realm`,
        [targetRole],
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log(`Đã gán vai trò ${role} cho người dùng ${userId}`);
    } catch (error: any) {
      console.error('Không thể gán vai trò cho người dùng:', error.message);
      if (error.response) {
        console.error('Dữ liệu phản hồi:', error.response.data);
        console.error('Mã trạng thái:', error.response.status);
      }
      throw new Error(`Không thể gán vai trò ${role} cho người dùng`);
    }
  }
}

export default new KeycloakService(); 