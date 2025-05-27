"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BookMarked, LayoutDashboard, Users, Edit3, UserCircle, LogOut, School, Library, UserPlus, ClipboardList } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getInitials = (name?: string) => {
    if (!name) return 'GV';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const navLinks = [
    { href: '/dashboard', label: 'Trang chủ', icon: <LayoutDashboard className="mr-2 h-4 w-4" />, roles: ['admin', 'teacher', 'student'] },
    { href: '/admin/users', label: 'Quản lý tài khoản', icon: <Users className="mr-2 h-4 w-4" />, roles: ['admin'] },
    { href: '/admin/subjects', label: 'Quản lý môn học', icon: <Library className="mr-2 h-4 w-4" />, roles: ['admin'] },
    { href: '/admin/registrations', label: 'Quản lý đăng ký', icon: <ClipboardList className="mr-2 h-4 w-4" />, roles: ['admin'] },
    { href: '/teacher/grades', label: 'Quản lý điểm số', icon: <Edit3 className="mr-2 h-4 w-4" />, roles: ['teacher'] },
    { href: '/student/grades', label: 'Điểm số của tôi', icon: <BookMarked className="mr-2 h-4 w-4" />, roles: ['student'] },
    { href: '/student/registration', label: 'Đăng ký môn học', icon: <UserPlus className="mr-2 h-4 w-4" />, roles: ['student'] },
  ];

  const availableLinks = navLinks.filter(link => user && link.roles.includes(user.role));

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container mx-auto flex h-16 items-center px-4">
        <Link href="/dashboard" className="flex items-center gap-2 mr-6">
          <School className="h-7 w-7 text-primary" />
          <span className="text-xl font-bold text-primary">GradeView</span>
        </Link>
        <nav className="flex items-center space-x-4 lg:space-x-6 flex-1">
          {availableLinks.map((link) => (
            <Button key={link.href} variant="ghost" asChild className="text-sm font-medium text-muted-foreground hover:text-foreground">
              <Link href={link.href}>
                {/* {link.icon} Desktop only icons perhaps? */}
                {link.label}
              </Link>
            </Button>
          ))}
        </nav>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9" data-ai-hint="user avatar">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </header>
  );
};

export default Navbar;
