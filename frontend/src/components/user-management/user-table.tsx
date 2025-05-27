"use client";

import { useState } from 'react';
import type { User } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Edit, Trash2, ShieldAlert, UserCheck, UserCog } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import EditUserDialog from './edit-user-dialog';

interface UserTableProps {
  users: User[];
  onDeleteUser: (userId: string) => void;
  onEditUser: (user: User) => void;
}

export default function UserTable({ users, onDeleteUser, onEditUser }: UserTableProps) {
  const { toast } = useToast();
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const getInitials = (name: string) => {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleDeleteConfirmation = () => {
    if (userToDelete && userToDelete.id) {
      onDeleteUser(userToDelete.id);
      toast({
        title: "User đã xóa",
        description: `${userToDelete.name} đã được xóa.`,
      });
      setUserToDelete(null);
    }
  };
  
  const roleIcon = (role: User['role']) => {
    switch (role) {
      case 'admin': return <UserCog className="h-4 w-4 text-red-500" />;
      case 'teacher': return <UserCheck className="h-4 w-4 text-blue-500" />;
      case 'student': return <ShieldAlert className="h-4 w-4 text-green-500" />; // Using ShieldAlert as a placeholder for student icon
      default: return null;
    }
  }

  return (
    <>
      <div className="rounded-lg border shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Avatar</TableHead>
              <TableHead>Tên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Vai trò</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                <TableCell>
                  <Avatar className="h-10 w-10" data-ai-hint="user avatar list">
                    <AvatarImage src={user.avatarUrl || `https://placehold.co/40x40.png?text=${getInitials(user.name)}`} alt={user.name} />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'teacher' ? 'default' : 'secondary'} className="capitalize flex items-center gap-1 w-fit">
                    {roleIcon(user.role)}
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Mở menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                      <EditUserDialog user={user} onUserUpdated={onEditUser}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Edit className="mr-2 h-4 w-4" />
                          Sửa user
                        </DropdownMenuItem>
                      </EditUserDialog>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setUserToDelete(user)}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa user
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {users.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Không tìm thấy user.</p>
      )}

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Điều này sẽ xóa tài khoản user 
              <span className="font-semibold"> {userToDelete?.name}</span> và xóa dữ liệu của họ khỏi hệ thống.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Đúng, xóa user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
