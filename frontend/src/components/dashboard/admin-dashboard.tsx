"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Settings, PlusCircle, Library, ClipboardList, Loader2 } from 'lucide-react';
import { UserAPI, SubjectAPI } from '@/lib/api';
import type { User, Subject } from '@/lib/types';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersData, subjectsData] = await Promise.all([
          UserAPI.getAll(),
          SubjectAPI.getAll()
        ]);
        setUsers(usersData);
        setSubjects(subjectsData);
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  // Count by role
  const totalStudents = users.filter(u => u.role === 'student').length;
  const totalTeachers = users.filter(u => u.role === 'teacher').length;
  const totalUsers = users.length;
  const totalSubjects = subjects.length;

  return (
    <div className="space-y-6">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Chào mừng, Quản trị viên!</CardTitle>
          <CardDescription>Quản lý tài khoản, môn học và kiểm soát hệ thống.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Đây là trung tâm của bạn để quản lý GradeView. Sử dụng điều hướng và hành động nhanh chóng bên dưới.</p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số tài khoản</CardTitle>
            <Users className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {totalStudents} students, {totalTeachers} teachers
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Môn học được cung cấp</CardTitle>
            <Library className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubjects}</div>
            <p className="text-xs text-muted-foreground">Trong tất cả các bộ môn</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
             <Settings className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col space-y-2">
             <Button asChild variant="outline">
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" /> Quản lý tài khoản
              </Link>
            </Button>
             <Button asChild variant="outline">
              <Link href="/admin/subjects">
                <Library className="mr-2 h-4 w-4" /> Quản lý môn học
              </Link>
            </Button>
             <Button asChild variant="outline">
              <Link href="/admin/registrations">
                <ClipboardList className="mr-2 h-4 w-4" /> Quản lý đăng ký
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
