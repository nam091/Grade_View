"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookMarked, UserCircle, BarChart2, Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { GradeAPI, SubjectAPI } from '@/lib/api';
import type { Grade, Subject } from '@/lib/types';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [studentGrades, setStudentGrades] = useState<Grade[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchData() {
      if (user?.id) {
        try {
          const [gradesData, subjectsData] = await Promise.all([
            GradeAPI.getAllForStudent(user.id),
            SubjectAPI.getStudentSubjects(user.id)
          ]);
          setStudentGrades(gradesData);
          setSubjects(subjectsData);
        } catch (error) {
          console.error("Error fetching student data:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    
    fetchData();
  }, [user]);
  
  const calculateAverageGrade = () => {
    if (!studentGrades.length) return "N/A";
    const numericGrades = studentGrades.filter(g => typeof g.grade === 'number');
    if (!numericGrades.length) return "N/A (Không có điểm số)";
    const totalPoints = numericGrades.reduce((sum, g) => sum + (g.grade as number), 0);
    return (totalPoints / numericGrades.length).toFixed(2);
  };
  
  const averageGrade = calculateAverageGrade();
  const subjectsTaken = subjects.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Đang tải dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Chào mừng, {user?.name || 'Sinh viên'}!</CardTitle>
          <CardDescription>Xem điểm số, hồ sơ và tiến độ học tập của bạn.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Đây là trang cá nhân của bạn để kiểm tra điểm số và quản lý thông tin hồ sơ.</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
            <BarChart2 className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageGrade}</div>
            <p className="text-xs text-muted-foreground">Based on numeric grades</p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Môn học đã đăng ký</CardTitle>
            <BookMarked className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectsTaken}</div>
            <p className="text-xs text-muted-foreground">Môn học bạn đã đăng ký</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Links</CardTitle>
             <UserCircle className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
             <Button asChild variant="outline">
              <Link href="/student/grades">
                <BookMarked className="mr-2 h-4 w-4" /> Xem điểm số của tôi
              </Link>
            </Button>
             <Button asChild variant="outline">
              <Link href="/student/registration">
                <UserPlus className="mr-2 h-4 w-4" /> Đăng ký môn học
              </Link>
            </Button>
             <Button asChild variant="outline">
              <Link href="/profile">
                <UserCircle className="mr-2 h-4 w-4" /> Xem hồ sơ của tôi
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
