"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { login as keycloakLogin } from '@/lib/keycloak';
import { useAuth } from '@/contexts/auth-context';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    // Nếu đã đăng nhập, chuyển đến trang dashboard
    if (isAuthenticated && !isLoading) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      // Gọi hàm đăng nhập sẽ chuyển hướng người dùng đến trang đăng nhập Keycloak
      await keycloakLogin(window.location.origin);
    } catch (error) {
      console.error("Lỗi đăng nhập:", error);
      setLoginError("Không thể đăng nhập. Vui lòng thử lại sau.");
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">Đăng nhập</CardTitle>
          <CardDescription>
            Vui lòng đăng nhập để tiếp tục sử dụng hệ thống
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : (
            <div className="space-y-4">
              {loginError && (
                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                  {loginError}
                </div>
              )}
              
              <Button 
                className="w-full" 
                onClick={handleLogin}
                disabled={isLoggingIn}
              >
                {isLoggingIn ? "Đang xử lý..." : "Đăng nhập với Keycloak"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
