export type Role = "admin" | "teacher" | "student";

export interface User {
  id?: string;  // Optional because it might not exist when creating
  keycloakId?: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl?: string;
  password?: string; // Only used during creation, never stored in state
}

export interface Subject {
  id: string;
  name: string;
  credits: number;
  teacherId?: string;
  teacherName?: string; // Denormalized for easier display
}

export interface Grade {
  id: string;
  studentId: string;
  studentName?: string; // Denormalized
  subjectId: string;
  subjectName?: string; // Denormalized
  grade: number | string; // e.g. 85 or 'A' or 'Pass'
  credits?: number; // Denormalized from subject
  teacherName?: string; // Denormalized from subject's teacher
}

// For teacher grade input
export interface StudentGradeEntry {
  studentId: string;
  studentName: string;
  currentGrade: number | string | null; // Grade might not be set yet
}

// Registration Request types
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';

export interface RegistrationRequest {
  id: string;
  studentId: string;
  subjectId: string;
  academicYear: string;
  status: RegistrationStatus;
  reason?: string;
  adminNote?: string;
  approvedBy?: string;
  requestedAt: string;
  approvedAt?: string;
  student?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  subject?: {
    id: string;
    name: string;
    code: string;
    credits: number;
  };
  approver?: {
    id: string;
    name: string;
    email: string;
  };
}
