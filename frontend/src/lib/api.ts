import { getToken } from './keycloak';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Hàm fetch chung với xác thực và xử lý lỗi
async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  
  try {
    console.log(`Fetching ${API_URL}${endpoint}`);
    if (options.method && options.body) {
      console.log(`Request method: ${options.method}, Request body:`, options.body);
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        message: `Error: ${response.status} ${response.statusText}` 
      }));
      
      console.error(`API error for ${endpoint}:`, errorData);
      throw new Error(errorData.message || `Error: ${response.status} ${response.statusText}`);
    }
    
    // Trả về null nếu response status là 204 No Content
    if (response.status === 204) {
      return null;
    }
    
    const data = await response.json();
    console.log(`API response for ${endpoint}:`, data);
    return data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error(`Unable to connect to server. Please check your network connection or try again later.`);
    }
    throw error;
  }
}

// API Users
export const UserAPI = {
  getAll: () => fetchWithAuth('/users'),
  getById: (id: string) => fetchWithAuth(`/users/${id}`),
  getByRole: (role: string) => fetchWithAuth(`/users/role/${role}`),
  create: (data: any) => fetchWithAuth('/users', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchWithAuth(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWithAuth(`/users/${id}`, { method: 'DELETE' }),
};

// API Subjects
export const SubjectAPI = {
  getAll: () => fetchWithAuth('/subjects'),
  getById: (id: string) => fetchWithAuth(`/subjects/${id}`),
  create: (data: any) => fetchWithAuth('/subjects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchWithAuth(`/subjects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWithAuth(`/subjects/${id}`, { method: 'DELETE' }),
  assignTeacher: (data: any) => fetchWithAuth('/subjects/assign-teacher', { method: 'POST', body: JSON.stringify(data) }),
  getTeacherSubjects: (teacherId: string) => fetchWithAuth(`/subjects/teacher/${teacherId}`),
  enrollStudent: (data: any) => fetchWithAuth('/subjects/enroll-student', { method: 'POST', body: JSON.stringify(data) }),
  getStudentSubjects: (studentId: string) => fetchWithAuth(`/subjects/student/${studentId}`),
  getEnrolledStudents: (subjectId: string, academicYear?: string) => {
    const queryParams = academicYear ? `?academicYear=${academicYear}` : '';
    return fetchWithAuth(`/subjects/${subjectId}/enrolled-students${queryParams}`);
  }
};

// API Grades
export const GradeAPI = {
  getAllForStudent: (studentId: string) => fetchWithAuth(`/grades/student/${studentId}`),
  getStudentGradesBySubject: (studentId: string, subjectId: string) => fetchWithAuth(`/grades/student/${studentId}/subject/${subjectId}`),
  getTeacherSubjectGrades: (teacherId: string, subjectId: string) => fetchWithAuth(`/grades/teacher/${teacherId}/subject/${subjectId}`),
  add: (data: any) => fetchWithAuth('/grades', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => fetchWithAuth(`/grades/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => fetchWithAuth(`/grades/${id}`, { method: 'DELETE' }),
};

// API Registration
export const RegistrationAPI = {
  // Sinh viên tạo yêu cầu đăng ký
  createRequest: (data: any) => fetchWithAuth('/registrations', { method: 'POST', body: JSON.stringify(data) }),
  
  // Admin lấy tất cả yêu cầu đăng ký
  getAllRequests: (status?: string, academicYear?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (academicYear) params.append('academicYear', academicYear);
    const queryString = params.toString();
    return fetchWithAuth(`/registrations${queryString ? `?${queryString}` : ''}`);
  },
  
  // Sinh viên lấy yêu cầu đăng ký của mình
  getStudentRequests: (studentId: string, status?: string, academicYear?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (academicYear) params.append('academicYear', academicYear);
    const queryString = params.toString();
    return fetchWithAuth(`/registrations/student/${studentId}${queryString ? `?${queryString}` : ''}`);
  },
  
  // Admin phê duyệt/từ chối yêu cầu
  processRequest: (requestId: string, action: 'approve' | 'reject', adminId: string, adminNote?: string) => 
    fetchWithAuth(`/registrations/${requestId}/process`, {
      method: 'PUT',
      body: JSON.stringify({ action, adminId, adminNote })
    }),
  
  // Lấy môn học có thể đăng ký
  getAvailableSubjects: (studentId: string, academicYear?: string) => {
    const params = new URLSearchParams();
    if (academicYear) params.append('academicYear', academicYear);
    const queryString = params.toString();
    return fetchWithAuth(`/registrations/available-subjects/${studentId}${queryString ? `?${queryString}` : ''}`);
  }
}; 