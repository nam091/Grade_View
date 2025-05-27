"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Edit3, BookOpen, UserCheck, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { SubjectAPI, UserAPI } from '@/lib/api';

// Define types
interface Subject {
  id: string;
  name: string;
  code?: string;
  credits?: number;
  description?: string;
  academicYear?: string;
}

interface User {
  id?: string;
  keycloakId?: string;
  name: string;
  email: string;
  role: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) {
        setLoading(false);
        setError("User is not authenticated");
        return;
      }

      if (!user.id) {
        setLoading(false);
        setError("User ID is missing");
        return;
      }

      if (user.role !== 'teacher') {
        setLoading(false);
        setError("User is not a teacher");
        return;
      }

      try {
        console.log(`Fetching data for teacher with ID: ${user.id}`);
        console.log('User info:', JSON.stringify({
          id: user.id,
          name: user.name,
          role: user.role
        }, null, 2));
        
        // Fetch subjects
        try {
          console.log(`Fetching teacher subjects for ID: ${user.id}`);
          const subjectsData = await SubjectAPI.getTeacherSubjects(user.id);
          console.log('Teacher subjects data received:', subjectsData);
          setTeacherSubjects(subjectsData || []);
        } catch (subjectError: any) {
          console.error("Error fetching teacher subjects:", subjectError);
          setError(`Failed to load subjects: ${subjectError.message || 'Unknown error'}`);
          setTeacherSubjects([]);
        }
        
        // Fetch students
        try {
          console.log('Fetching all students');
          const studentsData = await UserAPI.getByRole('student');
          console.log(`Found ${studentsData.length} students`);
          setTotalStudents(studentsData.length || 0);
        } catch (studentError: any) {
          console.error("Error fetching students:", studentError);
          setTotalStudents(0);
        }
      } catch (error: any) {
        console.error("Error in teacher dashboard:", error);
        setError(`Dashboard error: ${error.message || 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Đang tải dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" /> Lỗi tải dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <p className="mt-2">Vui lòng đảm bảo bạn đăng nhập là giáo viên và thử lại.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Chào mừng, {user?.name || 'Giáo viên'}!</CardTitle>
          <CardDescription>Quản lý điểm số cho môn học của bạn và xem tiến độ học tập của sinh viên.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Bảng tổng quan này cung cấp truy cập nhanh đến nhiệm vụ giảng dạy của bạn. Chọn hành động bên dưới hoặc sử dụng menu điều hướng.</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Môn học của bạn</CardTitle>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teacherSubjects.length}</div>
            <p className="text-xs text-muted-foreground">Môn học được giao cho bạn</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số sinh viên</CardTitle>
            <UserCheck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Trong hệ thống (cho mục đích tham khảo)</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
             <Edit3 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
             <Button asChild variant="outline">
              <Link href="/teacher/grades">
                <Edit3 className="mr-2 h-4 w-4" /> Nhập/Chỉnh sửa điểm số
              </Link>
            </Button>
             <Button variant="outline" disabled>
              Xem hiệu suất lớp (TBD)
            </Button>
          </CardContent>
        </Card>
      </div>

       {teacherSubjects.length > 0 ? (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Tổng quan môn học của bạn</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {teacherSubjects.map((subject: Subject) => (
                <li key={subject.id} className="p-3 border rounded-md bg-muted/50 flex justify-between items-center">
                  <span>{subject.name} ({subject.credits || 'N/A'} credits)</span>
                   <Button size="sm" asChild>
                     <Link href={`/teacher/grades?subjectId=${subject.id}`}>Quản lý điểm số</Link>
                   </Button>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Môn học của bạn</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Bạn hiện không có môn học được giao.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
