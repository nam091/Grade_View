"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, login } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Nếu đã đăng nhập, chuyển đến dashboard
        router.push('/dashboard');
      } else {
        // Nếu chưa đăng nhập, chuyển đến trang đăng nhập
        router.push('/login');
      }
    }
  }, [isAuthenticated, isLoading, router]);

  // Hiển thị loading trong khi kiểm tra
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Đang tải...</p>
        </div>
      </div>
    );
  }

  // Trang này sẽ không hiển thị vì đã chuyển hướng
  return null;
}