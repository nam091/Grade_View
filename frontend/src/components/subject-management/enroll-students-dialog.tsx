"use client";

import { useState, useEffect, ReactNode } from 'react';
import { UserAPI, SubjectAPI } from '@/lib/api';
import { Subject } from '@/lib/types';
import { Loader2, UserPlus, Search, CheckCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface EnrollStudentsDialogProps {
  subject: Subject;
  children: ReactNode;
}

interface Student {
  id: string;
  name: string;
  email: string;
  isEnrolled?: boolean;
}

export default function EnrollStudentsDialog({ subject, children }: EnrollStudentsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('2023-2024');
  const { toast } = useToast();

  // Load students and check enrollment status
  useEffect(() => {
    if (open) {
      const loadStudents = async () => {
        try {
          setLoading(true);
          // Fetch all students
          const allStudents = await UserAPI.getByRole('student');
          
          // Fetch current enrollments for this subject
          const enrolledStudents = await SubjectAPI.getEnrolledStudents(subject.id);
          
          // Filter out already enrolled students
          const unregisteredStudents = allStudents.filter(
            (student: any) => !enrolledStudents.some((e: any) => e.id.toString() === student.id.toString())
          ).map((student: any) => ({
            ...student,
            isEnrolled: false
          }));
          
          console.log(`Lọc ra ${unregisteredStudents.length} sinh viên chưa đăng ký từ ${allStudents.length} sinh viên`);
          setStudents(unregisteredStudents);
        } catch (error) {
          console.error('Lỗi tải sinh viên:', error);
          toast({
            title: "Lỗi",
            description: "Không thể tải sinh viên. Vui lòng thử lại.",
            variant: "destructive"
          });
        } finally {
          setLoading(false);
        }
      };
      
      loadStudents();
    }
  }, [open, subject.id, toast]);

  // Filter students based on search term
  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Toggle enrollment status for selection
  const toggleEnrollment = (studentId: string) => {
    setStudents(prevStudents => 
      prevStudents.map(student => 
        student.id === studentId 
          ? { ...student, isEnrolled: !student.isEnrolled } 
          : student
      )
    );
  };

  // Save enrollments
  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Get students that are now checked (since all shown students are unenrolled)
      const newEnrollments = students.filter(student => student.isEnrolled);
      
      console.log("Sinh viên cần đăng ký:", newEnrollments);
      
      if (newEnrollments.length === 0) {
        toast({
          title: "Không có sinh viên được chọn",
          description: "Vui lòng chọn ít nhất một sinh viên để đăng ký.",
        });
        setSaving(false);
        return;
      }
      
      // Process only new enrollments
      const enrollmentPromises = newEnrollments.map(student => 
        SubjectAPI.enrollStudent({
          studentId: student.id,
          subjectId: subject.id,
          academicYear
        })
      );
      
      await Promise.all(enrollmentPromises);
      
      toast({
        title: "Sinh viên đã được đăng ký",
        description: `Đã đăng ký thành công ${newEnrollments.length} sinh viên vào môn ${subject.name}`,
      });
      
      setOpen(false);
    } catch (error) {
      console.error('Lỗi lưu đăng ký:', error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu đăng ký. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <UserPlus className="mr-2 h-5 w-5 text-primary" />
             Đăng ký sinh viên trong môn học {subject.name}
          </DialogTitle>
          <DialogDescription>
            Chỉ hiển thị sinh viên chưa đăng ký môn học này. Chọn sinh viên để đăng ký cho năm học {academicYear}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 my-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm sinh viên theo tên hoặc email..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading students...</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden max-h-[300px] overflow-y-auto">
              {filteredStudents.length > 0 ? (
                <div className="divide-y">
                  {filteredStudents.map(student => (
                    <div key={student.id} className="flex items-center p-3 hover:bg-muted/50">
                      <Checkbox
                        id={`student-${student.id}`}
                        checked={student.isEnrolled}
                        onCheckedChange={() => toggleEnrollment(student.id)}
                      />
                      <Label 
                        htmlFor={`student-${student.id}`}
                        className="flex-grow ml-3 cursor-pointer"
                      >
                        <div className="font-medium">{student.name}</div>
                        <div className="text-sm text-muted-foreground">{student.email}</div>
                      </Label>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  {students.length === 0
                    ? "Tất cả sinh viên đã được đăng ký vào môn học này."
                    : "Không có sinh viên phù hợp với tiêu chí tìm kiếm của bạn."}
                </p>
              )}
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Hủy bỏ</Button>
          <Button 
            onClick={handleSave}
            disabled={saving || loading}
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <CheckCheck className="h-4 w-4" />
                Đăng ký sinh viên
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 