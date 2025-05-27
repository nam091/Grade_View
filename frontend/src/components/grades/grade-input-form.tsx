"use client";

import { useState, useEffect, useCallback } from 'react';
// Sử dụng import chuẩn nhưng bỏ qua lỗi TypeScript
// @ts-ignore
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/use-auth';
import { SubjectAPI, GradeAPI, UserAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, BookOpen, Users } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

// Interfaces cho các đối tượng
interface Subject {
  id: string;
  name: string;
  code?: string;
  credits?: number;
  description?: string;
}

interface Student {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

interface Grade {
  id: string;
  studentId: string;
  subjectId: string;
  teacherId: string;
  score: number;
  term: string;
  academicYear: string;
  comment?: string;
}

const gradeEntrySchema = z.object({
  studentId: z.string(),
  studentName: z.string(),
  score: z.union([z.string().min(1, "Grade is required."), z.number()]).nullable(),
});

const gradeInputFormSchema = z.object({
  subjectId: z.string().min(1, "Please select a subject"),
  grades: z.array(gradeEntrySchema),
  term: z.string().min(1, "Please select a term"),
});

type GradeInputFormValues = z.infer<typeof gradeInputFormSchema>;

export default function GradeInputForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [teacherSubjects, setTeacherSubjects] = useState<Subject[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [studentsData, setStudentsData] = useState<Student[]>([]);
  const [gradesData, setGradesData] = useState<Grade[]>([]);
  
  const form = useForm<GradeInputFormValues>({
    resolver: zodResolver(gradeInputFormSchema),
    defaultValues: {
      subjectId: '',
      grades: [],
      term: '',
    },
  });

  const { fields, replace } = useFieldArray({
    control: form.control,
    name: 'grades',
  });

  // Initial load of teacher's subjects
  useEffect(() => {
    async function fetchTeacherSubjects() {
      if (user && user.id) {
        try {
          console.log(`Lấy môn học cho giáo viên với ID: ${user.id}`);
          const data = await SubjectAPI.getTeacherSubjects(user.id);
          console.log('Dữ liệu môn học giáo viên nhận được:', data);
          
          if (!data || !Array.isArray(data) || data.length === 0) {
            console.warn('Không tìm thấy môn học cho giáo viên');
            toast({
              title: "Không tìm thấy môn học",
              description: "Bạn không có môn học được giao. Vui lòng liên hệ quản trị viên.",
              variant: "destructive"
            });
            setTeacherSubjects([]);
            return;
          }
          
          // Ensure all subject data is complete and has proper types
          const formattedSubjects = data.map((subject: any) => ({
            id: subject.id.toString(),
            name: subject.name || 'Môn học không tên',
            code: subject.code,
            credits: subject.credits,
            description: subject.description
          }));
          
          console.log('Môn học giáo viên đã được định dạng:', formattedSubjects);
          setTeacherSubjects(formattedSubjects);
          
          // Auto-select subject from URL if available
          const subjectIdFromUrl = searchParams.get('subjectId');
          if (subjectIdFromUrl && formattedSubjects.some((s: any) => s.id === subjectIdFromUrl)) {
            console.log(`Tự động chọn môn học từ URL: ${subjectIdFromUrl}`);
            form.setValue('subjectId', subjectIdFromUrl);
            
            // If we have a default term, we can also select that
            form.setValue('term', 'Term 1');
          }
        } catch (error: any) {
          console.error("Lỗi khi tải môn học của giáo viên:", error);
          
          // Hiển thị thông báo lỗi chi tiết
          let errorMessage = "Không thể tải môn học của bạn.";
          if (error.message) {
            errorMessage += ` ${error.message}`;
          }
          
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive"
          });
          
          // Đặt một mảng rỗng để tránh lỗi
          setTeacherSubjects([]);
        }
      } else {
        console.warn('Không có người dùng hoặc ID người dùng, không thể tải môn học của giáo viên');
      }
    }
    
    fetchTeacherSubjects();
  }, [user, form, searchParams, toast]);
  
  // Load students for the selected subject
  const loadStudentsForSubject = useCallback(async (subjectId: string, term: string) => {
    if (!subjectId || !user?.id) return;
    
    try {
      setIsLoading(true);
      
      // Find and set the selected subject
      const subject = teacherSubjects.find((s: Subject) => s.id === subjectId);
      if (!subject) {
        console.error(`Môn học với ID ${subjectId} không được tìm thấy trong môn học của giáo viên`);
        toast({
          title: "Lỗi",
          description: "Không thể tìm thấy môn học đã chọn. Vui lòng thử lại.",
          variant: "destructive"
        });
        setIsLoading(false);
        return;
      }
      
      console.log(`Môn học đã chọn:`, subject);
      setSelectedSubject(subject);
      
      console.log(`Đang tải sinh viên đã đăng ký môn học với ID: ${subjectId}, học kỳ: ${term}`);
      
      // Get enrolled students
      const enrolledStudents = await SubjectAPI.getEnrolledStudents(subjectId);
      console.log(`Dữ liệu sinh viên đã đăng ký môn học:`, enrolledStudents);
      
      if (!enrolledStudents || !Array.isArray(enrolledStudents) || enrolledStudents.length === 0) {
        console.log(`Không có sinh viên đã đăng ký môn học với ID: ${subjectId}`);
        setStudentsData([]);
        replace([]);
        setIsLoading(false);
        return;
      }
      
      // Map enrolled students to correct format
      const mappedStudents = enrolledStudents.map((student: any) => ({
        id: student.id.toString(), // Ensure ID is string
        name: student.name,
        email: student.email,
        role: student.role
      }));
      
      console.log("Sinh viên đã được định dạng:", mappedStudents);
      setStudentsData(mappedStudents);
      
      // Get any existing grades for this subject/term
      const existingGrades = await GradeAPI.getTeacherSubjectGrades(user.id, subjectId) as Grade[];
      console.log(`Điểm số tồn tại cho môn học ${subjectId}:`, existingGrades);
      setGradesData(existingGrades);
      
      // Prepare student grade entries
      const studentGradeEntries = mappedStudents.map((student: Student) => {
        // Find existing grade if any
        const existingGrade = existingGrades.find(
          (g: Grade) => g.studentId.toString() === student.id.toString() && 
                        g.subjectId.toString() === subjectId && 
                        g.term === term
        );
        
        return {
          studentId: student.id,
          studentName: student.name,
          score: existingGrade ? existingGrade.score : null,
        };
      });
      
      console.log(`Mục điểm đã chuẩn bị:`, studentGradeEntries);
      replace(studentGradeEntries);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải sinh viên và điểm số. Vui lòng thử lại.",
        variant: "destructive"
      });
      setStudentsData([]);
      replace([]);
    } finally {
      setIsLoading(false);
    }
  }, [teacherSubjects, user, replace, toast]);

  // When subject or term changes, load the students and grades
  useEffect(() => {
    const subjectId = form.getValues('subjectId');
    const term = form.getValues('term');
    
    console.log(`Môn học hoặc học kỳ đã thay đổi - subjectId: ${subjectId}, term: ${term}`);
    
    if (subjectId && term) {
      loadStudentsForSubject(subjectId, term);
    }
  }, [form.watch('subjectId'), form.watch('term'), loadStudentsForSubject]);

  const onSubmit: SubmitHandler<GradeInputFormValues> = async (data: GradeInputFormValues) => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      // Submit grades for each student
      const promises = data.grades
        .filter((entry: any) => entry.score !== null && entry.score !== '')
        .map((entry: any) => {
          // Check if this grade already exists
          const existingGrade = gradesData.find(
            (g: Grade) => g.studentId === entry.studentId && 
                 g.subjectId === data.subjectId && 
                 g.term === data.term
          );
          
          const gradeData = {
            studentId: entry.studentId,
            subjectId: data.subjectId,
            teacherId: user.id,
            score: typeof entry.score === 'string' ? parseFloat(entry.score) : entry.score,
            term: data.term,
            academicYear: '2023-2024', // This should be configurable in a real app
            comment: '',
          };
          
          if (existingGrade) {
            // Update existing grade
            return GradeAPI.update(existingGrade.id, gradeData);
          } else {
            // Create new grade
            return GradeAPI.add(gradeData);
          }
        });
      
      await Promise.all(promises);
      
      toast({
        title: "Điểm số đã được lưu",
        description: `Điểm số cho ${selectedSubject?.name || 'môn học'} đã được cập nhật thành công.`,
      });
      
      // Reload data to get fresh state
      loadStudentsForSubject(data.subjectId, data.term);
    } catch (error) {
      console.error("Lỗi khi lưu điểm số:", error);
      toast({
        title: "Lỗi",
        description: "Không thể lưu điểm số. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user || user.role !== 'teacher') {
    return <p>Bạn không có quyền truy cập trang này.</p>;
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center"><BookOpen className="mr-3 h-7 w-7 text-primary" /> Nhập điểm số</CardTitle>
        <CardDescription>Chọn môn học và nhập hoặc cập nhật điểm số cho sinh viên của bạn.</CardDescription>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="subjectId" className="text-base">Chọn Môn Học</Label>
              <Select
                value={form.watch('subjectId')}
                onValueChange={(value) => {
                  console.log(`Subject selected: ${value}`);
                  form.setValue('subjectId', value, { shouldValidate: true });
                  
                  // If both subject and term are selected, this will trigger the useEffect
                  if (form.getValues('term')) {
                    loadStudentsForSubject(value, form.getValues('term'));
                  }
                }}
                disabled={isLoading}
              >
                <SelectTrigger id="subjectId" className="mt-1 text-base">
                  <SelectValue placeholder="-- Select a Subject --" />
                </SelectTrigger>
                <SelectContent>
                  {teacherSubjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id} className="text-base">
                      {subject.name}
                    </SelectItem>
                  ))}
                  {teacherSubjects.length === 0 && <SelectItem value="no-subjects" disabled>No subjects assigned</SelectItem>}
                </SelectContent>
              </Select>
              {form.formState.errors.subjectId && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.subjectId.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="term" className="text-base">Select Term</Label>
              <Select
                value={form.watch('term')}
                onValueChange={(value) => {
                  console.log(`Term selected: ${value}`);
                  form.setValue('term', value, { shouldValidate: true });
                  
                  // If both subject and term are selected, this will trigger the useEffect
                  if (form.getValues('subjectId')) {
                    loadStudentsForSubject(form.getValues('subjectId'), value);
                  }
                }}
                disabled={isLoading || !form.watch('subjectId')}
              >
                <SelectTrigger id="term" className="mt-1 text-base">
                  <SelectValue placeholder="-- Select a Term --" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term 1" className="text-base">Điểm thành phần 1</SelectItem>
                  <SelectItem value="Term 2" className="text-base">Điểm thành phần 2</SelectItem>
                  <SelectItem value="Final" className="text-base">Điểm cuối kỳ</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.term && (
                <p className="text-sm text-destructive mt-1">{form.formState.errors.term.message}</p>
              )}
            </div>
          </div>

          {selectedSubject && fields.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center"><Users className="mr-2 h-5 w-5 text-primary"/> Students for {selectedSubject.name}</h3>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60%] font-semibold text-base">Tên Sinh Viên</TableHead>
                      <TableHead className="font-semibold text-base">Điểm</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field: any, index: number) => (
                      <TableRow key={field.id}>
                        <TableCell className="font-medium py-3">
                          {field.studentName}
                        </TableCell>
                        <TableCell className="py-2">
                          <Input
                            type="text" // Allow numeric input
                            placeholder="e.g., 8.5"
                            {...form.register(`grades.${index}.score`)}
                            disabled={isLoading}
                            className="text-base h-10"
                          />
                           {form.formState.errors.grades?.[index]?.score && (
                            <p className="text-sm text-destructive mt-1">{form.formState.errors.grades?.[index]?.score?.message}</p>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
          {form.watch('subjectId') && form.watch('term') && fields.length === 0 && !isLoading && (
             <p className="text-muted-foreground text-center py-4">Không tìm thấy sinh viên đã đăng ký môn học này.</p>
          )}


        </CardContent>
        {selectedSubject && fields.length > 0 && (
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isLoading || !form.formState.isDirty} className="w-full sm:w-auto text-base py-3">
              {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
              <Save className="mr-2 h-4 w-4" /> Lưu điểm số
            </Button>
          </CardFooter>
        )}
      </form>
    </Card>
  );
}
