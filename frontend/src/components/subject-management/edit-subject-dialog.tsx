"use client";

import { useState, useEffect } from 'react';
// Sử dụng import chuẩn nhưng bỏ qua lỗi TypeScript
// @ts-ignore
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Edit, Loader2 } from 'lucide-react';
import { UserAPI, SubjectAPI } from '@/lib/api';

// Thêm định nghĩa cho các kiểu dữ liệu
interface Teacher {
  id: string;
  name: string;
  email?: string;
}

// Sửa lại interface FormField để khớp với react-hook-form
interface FormField {
  value: any;
  onChange: (...event: any[]) => void;
  onBlur: () => void;
  name: string;
  ref: React.Ref<any>;
}

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Tên môn học phải có ít nhất 2 ký tự.",
  }),
  code: z.string().min(2, {
    message: "Mã môn học phải có ít nhất 2 ký tự.",
  }),
  description: z.string().optional(),
  teacherId: z.string().optional(),
  credits: z.coerce.number().min(0).optional(),
});

type SubjectFormValues = z.infer<typeof formSchema>;

interface EditSubjectDialogProps {
  subject: any;
  children: React.ReactNode;
  onSubjectUpdated: (subject: any) => void;
}

export default function EditSubjectDialog({ subject, children, onSubjectUpdated }: EditSubjectDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  
  // Get the initial teacher ID from subject data when available
  useEffect(() => {
    if (subject && subject.teacherId) {
      console.log("Tìm thấy teacherId trong môn học:", subject.teacherId);
      setTeacherId(subject.teacherId);
    } else {
      console.log("Không tìm thấy teacherId trong môn học, đặt thành none");
      setTeacherId("none");
    }
  }, [subject]);
  
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: subject.name || "",
      code: subject.code || "",
      description: subject.description || "",
      teacherId: teacherId || "none",
      credits: subject.credits || 0,
    },
  });
  
  // Update form values when teacherId changes
  useEffect(() => {
    if (teacherId) {
      form.setValue("teacherId", teacherId);
    }
  }, [teacherId, form]);
  
  useEffect(() => {
    async function fetchTeachers() {
      try {
        const teachersData = await UserAPI.getByRole('teacher');
        console.log("Tải giáo viên:", teachersData);
        setTeachers(teachersData);
      } catch (error) {
        console.error("Lỗi tải giáo viên:", error);
      }
    }
    
    // Reset form when subject changes
    form.reset({
      name: subject.name || "",
      code: subject.code || "",
      description: subject.description || "",
      teacherId: teacherId || "none",
      credits: subject.credits || 0,
    });
    
    // Fetch teachers when dialog opens
    if (open) {
      fetchTeachers();
    }
  }, [open, subject, form, teacherId]);
  
  async function onSubmit(values: SubjectFormValues) {
    setLoading(true);
    console.log("Gửi form với giá trị:", values);
    
    try {
      // Update the subject first
      const updatedSubject = await SubjectAPI.update(subject.id, values);
      console.log("Môn học đã cập nhật:", updatedSubject);
      
      // Handle teacher assignment separately
      const teacherIdToAssign = values.teacherId === "none" ? null : values.teacherId;
      console.log(`Gán giáo viên: ${teacherIdToAssign || "none (xóa)"} cho môn học ${subject.id}`);
      
      try {
        const assignmentResult = await SubjectAPI.assignTeacher({
          teacherId: teacherIdToAssign,
          subjectId: subject.id,
          academicYear: '2023-2024' // This should be configurable
        });
        console.log("Kết quả gán giáo viên:", assignmentResult);
      } catch (assignError) {
        console.error("Lỗi trong quá trình gán giáo viên:", assignError);
        toast({
          title: "Gán giáo viên thất bại",
          description: "Môn học đã được cập nhật, nhưng gán giáo viên thất bại.",
          variant: "destructive"
        });
      }
      
      // Prepare the updated subject object with teacher info
      const resultSubject = {
        ...subject,
        ...values,
        teacherId: values.teacherId === "none" ? null : values.teacherId,
      };
      
      onSubjectUpdated(resultSubject);
      toast({
        title: "Môn học đã cập nhật",
        description: `${values.name} đã được cập nhật thành công.`,
      });
      
      setOpen(false);
    } catch (error: any) {
      console.error("Lỗi cập nhật môn học:", error);
      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Đã xảy ra lỗi khi cập nhật môn học",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Subject</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin môn học và gán giáo viên.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: FormField }) => (
                <FormItem>
                  <FormLabel>Tên môn học</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: Toán cao cấp I" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }: { field: FormField }) => (
                <FormItem>
                  <FormLabel>Mã môn học</FormLabel>
                  <FormControl>
                    <Input placeholder="Ví dụ: MATH101" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="credits"
              render={({ field }: { field: FormField }) => (
                <FormItem>
                  <FormLabel>Tín chỉ</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ví dụ: 3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }: { field: FormField }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Nhập một mô tả ngắn gọn về môn học" 
                      {...field} 
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }: { field: FormField }) => (
                <FormItem>
                  <FormLabel>Gán giáo viên</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      console.log("Chọn giáo viên:", value);
                      field.onChange(value);
                      setTeacherId(value);
                    }}
                    value={field.value || "none"}
                    defaultValue="none"
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giáo viên" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id.toString()}>
                          {teacher.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 