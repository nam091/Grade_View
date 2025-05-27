"use client";

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { Role } from '@/lib/types';

export default function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    role: ''
  });

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      email: '',
      password: '',
      role: ''
    };

    // Validate email
    if (!email) {
      newErrors.email = "Email là bắt buộc";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Email không hợp lệ";
      valid = false;
    }

    // Validate password
    if (!password) {
      newErrors.password = "Mật khẩu là bắt buộc";
      valid = false;
    }

    // Validate role
    if (!role) {
      newErrors.role = "Vui lòng chọn vai trò";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await login();
      toast({
        title: "Đăng nhập thành công",
        description: "Chào mừng trở lại!",
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: "Đăng nhập thất bại",
        description: error.message || "Đã xảy ra lỗi không mong muốn.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader>
        <CardTitle className="text-3xl font-bold text-center text-primary">Đăng nhập vào GradeView</CardTitle>
        <CardDescription className="text-center">Nhập thông tin để truy cập tài khoản của bạn.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="text-base"
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                className="text-base pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
              </Button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password}</p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Login as</Label>
            <RadioGroup
              defaultValue="student"
              onValueChange={(value) => setRole(value as Role)}
              className="flex space-x-4"
              disabled={isLoading}
            >
              {(['student', 'teacher', 'admin'] as Role[]).map((roleOption) => (
                <div key={roleOption} className="flex items-center space-x-2">
                  <RadioGroupItem value={roleOption} id={`role-${roleOption}`} />
                  <Label htmlFor={`role-${roleOption}`} className="font-normal capitalize">{roleOption}</Label>
                </div>
              ))}
            </RadioGroup>
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>

          <Button type="submit" className="w-full text-base py-3" disabled={isLoading}>
            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
            Log In
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Sử dụng thông tin đăng nhập mẫu: e.g., student@example.com, teacher.ada@example.com, admin@example.com. Mật khẩu có thể là bất cứ điều gì.
        </p>
      </CardContent>
    </Card>
  );
}
