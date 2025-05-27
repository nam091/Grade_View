"use client";

import { useState, useEffect } from 'react';
// @ts-ignore
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Edit2, Save, Mail, User, Briefcase, Loader2 } from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  // Email editing is usually more complex (verification), so we'll disable it or make it display-only
  // avatarUrl: z.string().url("Invalid URL for avatar.").optional().or(z.literal('')),
});
type ProfileFormInputs = z.infer<typeof profileSchema>;

export default function ProfileDetails() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProfileFormInputs>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      // avatarUrl: user?.avatarUrl || '',
    },
  });
  
  // Reset form when user data changes or editing state changes
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        // avatarUrl: user.avatarUrl || '',
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, form.reset, isEditing]);


  const getInitials = (name?: string) => {
    if (!name) return '??';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Note: This functionality is no longer used since we're removing edit capability
  const onSubmit = async (data: ProfileFormInputs) => {
    if (!user) return;
    setIsLoading(true);
    // Display a message that profile editing is not allowed
    toast({
      title: "Tính năng bị tắt",
      description: "Chỉ có quản trị viên mới có thể chỉnh sửa hồ sơ.",
      variant: "destructive"
    });
    setIsEditing(false);
    setIsLoading(false);
  };

  // Check if user is admin - only admins can edit profiles
  const isAdmin = user?.role === 'admin';

  if (!user) {
    return <p>Đang tải hồ sơ người dùng...</p>;
  }

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Avatar className="h-24 w-24 ring-4 ring-primary ring-offset-2 ring-offset-background" data-ai-hint="user profile large">
            <AvatarImage src={user.avatarUrl || `https://placehold.co/150x150.png?text=${getInitials(user.name)}`} alt={user.name} />
            <AvatarFallback className="text-3xl">{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </div>
        <CardTitle className="text-3xl">{isEditing ? 'Chỉnh sửa hồ sơ' : user.name}</CardTitle>
        <CardDescription>
          <Badge variant="secondary" className="capitalize text-sm mt-1">{user.role}</Badge>
        </CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="flex items-center"><User className="mr-2 h-4 w-4 text-muted-foreground" />Full Name</Label>
            <Input
              id="name"
              {...form.register('name')}
              disabled={!isEditing || isLoading}
              className="text-lg"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center"><Mail className="mr-2 h-4 w-4 text-muted-foreground" />Email Address</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              disabled
              className="text-lg bg-muted/50 cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">Email không thể thay đổi.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="role" className="flex items-center"><Briefcase className="mr-2 h-4 w-4 text-muted-foreground" />Role</Label>
            <Input
              id="role"
              value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              disabled
              className="text-lg bg-muted/50 cursor-not-allowed"
            />
          </div>
        </CardContent>
        <CardFooter className="border-t pt-6 flex justify-end space-x-3">
          {isAdmin && isEditing ? (
            <>
              <Button variant="outline" onClick={() => { setIsEditing(false); form.reset({name: user.name}); }} disabled={isLoading}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
              </Button>
            </>
          ) : isAdmin ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="mr-2 h-4 w-4" /> Chỉnh sửa hồ sơ
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground italic">Chỉ có quản trị viên mới có thể chỉnh sửa hồ sơ.</p>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
