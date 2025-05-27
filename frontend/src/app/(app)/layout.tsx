"use client";

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import Navbar from '@/components/layout/navbar';
import { Loader2 } from 'lucide-react';

// Define allowed routes for each role
const roleRoutes: Record<string, string[]> = {
  admin: ['/dashboard', '/profile', '/admin/users', '/admin/subjects', '/admin/registrations'],
  teacher: ['/dashboard', '/profile', '/teacher/grades'],
  student: ['/dashboard', '/profile', '/student/grades', '/student/registration'],
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, isLoading: loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.replace('/login');
      } else {
        // Basic role-based route protection
        const allowedPaths = roleRoutes[user.role];
        if (allowedPaths && !allowedPaths.some(path => pathname.startsWith(path))) {
          // If current path is not allowed for the role, redirect to dashboard
          // This is a simplistic check, more robust checking might be needed for params etc.
          // console.warn(`Redirecting: User role ${user.role} trying to access ${pathname}. Allowed: ${allowedPaths.join(', ')}`);
          // router.replace('/dashboard');
          // For now, let's allow access but specific page components can deny rendering or show unauthorized message.
          // This avoids redirect loops if dashboard itself has sub-paths not listed.
        }
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
     // This case should ideally be handled by the useEffect redirect,
     // but as a fallback, show loading or null.
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
         <p className="ml-2">Đang chuyển hướng đến trang đăng nhập...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} ATMMT From TEAM 12
      </footer>
    </div>
  );
}
