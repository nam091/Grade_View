"use client";

import { useState, useEffect } from 'react';
import type { Subject, User } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { SubjectAPI, UserAPI } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Loader2, Library, PlusCircle } from 'lucide-react';
import AddSubjectDialog from '@/components/subject-management/add-subject-dialog';
import SubjectTable from '@/components/subject-management/subject-table';

interface ExtendedSubject extends Subject {
  teacherName?: string;
}

export default function AdminSubjectsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [subjects, setSubjects] = useState<ExtendedSubject[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Function to load subjects with teacher information
  const loadSubjectsWithTeachers = async () => {
    try {
      setPageLoading(true);
      const subjectsData = await SubjectAPI.getAll();
      console.log("Đã tải dữ liệu môn học:", subjectsData);
      
      // Get all teachers to map their names
      const teachers = await UserAPI.getByRole('teacher');
      console.log("Đã tải dữ liệu giáo viên:", teachers);
      
      // Map teacher names to subjects
      const enhancedSubjects = subjectsData.map((subject: Subject) => {
        // Find teacher assigned to this subject
        const teacherId = subject.teacherId;
        console.log(`ID giáo viên cho môn học ${subject.name}:`, teacherId);
        
        // Find teacher details
        const teacher = teachers.find((t: User) => t.id?.toString() === teacherId);
        console.log(`Tìm thấy giáo viên cho môn học ${subject.name}:`, teacher?.name || "Không có");
        
        return {
          ...subject,
          teacherId: teacherId || "",
          teacherName: teacher ? teacher.name : '',
        };
      });
      
      console.log("Môn học đã được cải thiện với thông tin giáo viên:", enhancedSubjects);
      setSubjects(enhancedSubjects);
    } catch (error) {
      console.error("Lỗi khi tải môn học với giáo viên:", error);
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) {
      loadSubjectsWithTeachers();
    }
  }, [user, authLoading]);

  const handleSubjectAdded = async (newSubject: Subject) => {
    try {
      await SubjectAPI.create(newSubject);
      
      // If teacher was assigned, create a teacher assignment
      if (newSubject.teacherId) {
        await SubjectAPI.assignTeacher({
          teacherId: newSubject.teacherId,
          subjectId: newSubject.id,
          academicYear: '2023-2024' // This should be configurable
        });
      }
      
      // Refresh subjects list with updated teacher info
      await loadSubjectsWithTeachers();
    } catch (error) {
      console.error("Lỗi khi thêm môn học:", error);
    }
  };

  const handleEditSubject = async (updatedSubject: ExtendedSubject) => {
    // Refresh the subject list to get fresh data including teacher assignments
    await loadSubjectsWithTeachers();
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      await SubjectAPI.delete(subjectId);
      // Remove from local state
      setSubjects(prevSubjects => prevSubjects.filter(s => s.id !== subjectId));
    } catch (error) {
      console.error("Lỗi khi xóa môn học:", error);
    }
  };

  if (authLoading || pageLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Đang tải dữ liệu môn học...</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
     return (
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" /> Từ chối truy cập
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Bạn không có quyền truy cập trang này.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <Card className="shadow-xl">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-3xl flex items-center"><Library className="mr-3 h-8 w-8 text-primary" /> Quản lý môn học</CardTitle>
            <CardDescription className="text-md">Xem, thêm và quản lý môn học trong hệ thống.</CardDescription>
          </div>
          <AddSubjectDialog onSubjectAdded={handleSubjectAdded}>
             <button className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2">
                <PlusCircle className="mr-2 h-4 w-4" /> Thêm môn học mới
             </button>
          </AddSubjectDialog>
        </CardHeader>
        <CardContent>
          <SubjectTable 
            subjects={subjects} 
            onDeleteSubject={handleDeleteSubject}
            onEditSubject={handleEditSubject}
          />
        </CardContent>
      </Card>
    </div>
  );
}
