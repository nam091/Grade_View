"use client";

import { useState } from 'react';
// @ts-ignore
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User, Role } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, UserPlus, Eye, EyeOff } from 'lucide-react';

const addUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(["student", "teacher", "admin"], { required_error: "Please select a role." }),
});

type AddUserFormInputs = z.infer<typeof addUserSchema>;

interface AddUserDialogProps {
  onUserAdded: (newUser: User) => void;
}

export default function AddUserDialog({ onUserAdded }: AddUserDialogProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<AddUserFormInputs>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      role: 'student',
    },
  });

  const onSubmit = async (data: AddUserFormInputs) => {
    setIsLoading(true);
    
    try {
      // Gửi dữ liệu đầy đủ để tạo user
      const userData = {
        name: data.name,
        email: data.email,
        password: data.password, // Quan trọng: Đảm bảo gửi password
        role: data.role as Role,
      };
      
      console.log("Đang gửi dữ liệu user:", { ...userData, password: '******' });

      // Callback cho parent component
      onUserAdded(userData as any);
      
      toast({
        title: "Đã thêm user",
        description: `${data.name} đã được thêm thành công là ${data.role}.`,
      });
      
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Lỗi thêm user:", error);
      toast({
        title: "Không thể thêm user",
        description: "Đã xảy ra lỗi khi tạo user. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">
          <UserPlus className="mr-2 h-4 w-4" /> Thêm user mới
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Thêm user mới</DialogTitle>
          <DialogDescription>
            Điền thông tin bên dưới để tạo tài khoản user mới.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Họ và tên</Label>
            <Input id="name" {...form.register('name')} placeholder="e.g., John Doe" disabled={isLoading} />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...form.register('email')} placeholder="user@example.com" disabled={isLoading} />
            {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Mật khẩu</Label>
             <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...form.register('password')}
                disabled={isLoading}
                className="pr-10"
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
              </Button>
            </div>
            {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Vai trò</Label>
            <Select
              onValueChange={(value) => form.setValue('role', value as Role)}
              defaultValue={form.getValues('role')}
              disabled={isLoading}
            >
              <SelectTrigger id="role">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Sinh viên</SelectItem>
                <SelectItem value="teacher">Giáo viên</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.role && <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>}
          </div>
        
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
              Hủy bỏ
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Thêm user
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
