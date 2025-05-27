"use client";

import { useAuth } from '@/hooks/use-auth';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import TeacherDashboard from '@/components/dashboard/teacher-dashboard';
import StudentDashboard from '@/components/dashboard/student-dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  if (!user) {
    // This should ideally be caught by the layout, but as a fallback:
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" /> Từ chối truy cập
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Bạn phải đăng nhập để xem trang này. Đang chuyển hướng đến đăng nhập...</p>
        </CardContent>
      </Card>
    );
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'admin':
        return <AdminDashboard />;
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      default:
        return (
           <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-destructive flex items-center">
                <AlertTriangle className="mr-2 h-6 w-6" /> Lỗi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>Vai trò người dùng không hợp lệ. Vui lòng liên hệ hỗ trợ.</p>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="container mx-auto py-8">
      {renderDashboard()}
    </div>
  );
}
