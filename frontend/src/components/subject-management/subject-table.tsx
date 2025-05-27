"use client";

import { useState } from 'react';
import type { Subject } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, BookOpen, UserCircle, Tag, UserPlus } from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import EditSubjectDialog from './edit-subject-dialog';
import EnrollStudentsDialog from './enroll-students-dialog';

interface SubjectTableProps {
  subjects: Subject[];
  onDeleteSubject: (subjectId: string) => void;
  onEditSubject: (subject: Subject) => void;
}

export default function SubjectTable({ subjects, onDeleteSubject, onEditSubject }: SubjectTableProps) {
  const { toast } = useToast();
  const [subjectToDelete, setSubjectToDelete] = useState<Subject | null>(null);

  const handleDeleteConfirmation = () => {
    if (subjectToDelete) {
      onDeleteSubject(subjectToDelete.id);
      toast({
        title: "Môn học đã xóa",
        description: `${subjectToDelete.name} đã được xóa.`,
        variant: 'default',
      });
      setSubjectToDelete(null);
    }
  };

  return (
    <>
      <div className="rounded-lg border shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]"><BookOpen className="inline-block mr-2 h-4 w-4 text-muted-foreground"/>Tên môn học</TableHead>
              <TableHead className="text-center"><Tag className="inline-block mr-2 h-4 w-4 text-muted-foreground"/>Tín chỉ</TableHead>
              <TableHead><UserCircle className="inline-block mr-2 h-4 w-4 text-muted-foreground"/>Giáo viên được gán</TableHead>
              <TableHead className="text-right">  </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject) => (
              <TableRow key={subject.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="font-medium">{subject.name}</TableCell>
                <TableCell className="text-center">
                    <Badge variant="secondary">{subject.credits}</Badge>
                </TableCell>
                <TableCell>{subject.teacherName || 'N/A'}</TableCell>
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
                      <EditSubjectDialog
                        subject={subject}
                        onSubjectUpdated={onEditSubject}
                      >
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <Edit className="mr-2 h-4 w-4" />
                          Sửa môn học
                        </DropdownMenuItem>
                      </EditSubjectDialog>
                      
                      <EnrollStudentsDialog subject={subject}>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          Đăng ký sinh viên
                        </DropdownMenuItem>
                      </EnrollStudentsDialog>
                      
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setSubjectToDelete(subject)}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Xóa môn học
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {subjects.length === 0 && (
        <p className="text-center text-muted-foreground py-8">Không tìm thấy môn học. Bạn có thể thêm mới môn học bằng nút trên cùng.</p>
      )}

      <AlertDialog open={!!subjectToDelete} onOpenChange={(open) => !open && setSubjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Điều này sẽ xóa môn học 
              <span className="font-semibold"> {subjectToDelete?.name}</span>. 
              Điều này có thể ảnh hưởng đến các bản ghi điểm và gán giáo viên.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSubjectToDelete(null)}>Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirmation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Đúng, xóa môn học
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
