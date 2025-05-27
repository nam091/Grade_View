"use client";

import { useState, useEffect } from 'react';
import type { User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { UserAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Users } from 'lucide-react';
import AddUserDialog from '@/components/user-management/add-user-dialog';
import UserTable from '@/components/user-management/user-table';

export default function AdminUsersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const loadUsers = async () => {
    try {
      setPageLoading(true);
      const usersData = await UserAPI.getAll();
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadUsers();
    }
  }, [user, authLoading]);

  const handleUserAdded = async (newUser: User) => {
    try {
      console.log('Sending user data to API:', { ...newUser, password: '******' });
      await UserAPI.create(newUser);
      // Refresh users list
      await loadUsers();
    } catch (error: any) {
      console.error("Error adding user:", error);
      // Hiển thị lỗi cụ thể hơn cho người dùng
      const errorMessage = error.message || 'Unknown error occurred';
      
      // Sử dụng toast hoặc alert để hiển thị lỗi
      if (typeof window !== 'undefined') {
        alert(`Failed to create user: ${errorMessage}`);
      }
    }
  };

  const handleEditUser = async (updatedUser: User) => {
    // Refresh the user list to get updated data
    await loadUsers();
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await UserAPI.delete(userId);
      // Remove from local state
      setUsers(prevUsers => prevUsers.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
     return (
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" /> Từ chối truy cập
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Bạn không có quyền truy cập trang này.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-3xl flex items-center"><Users className="mr-3 h-8 w-8 text-primary" /> Quản lý tài khoản người dùng</CardTitle>
            <CardDescription className="text-md">Xem, thêm và quản lý tài khoản người dùng trong hệ thống.</CardDescription>
          </div>
          <AddUserDialog onUserAdded={handleUserAdded} />
        </CardHeader>
        <CardContent>
          <UserTable 
            users={users} 
            onDeleteUser={handleDeleteUser} 
            onEditUser={handleEditUser}
          />
        </CardContent>
      </Card>
    </div>
  );
}
