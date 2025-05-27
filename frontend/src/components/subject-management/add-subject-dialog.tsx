"use client";

import { useState, useEffect } from 'react';
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
// @ts-ignore
import { v4 as uuidv4 } from 'uuid';
import { UserAPI } from '@/lib/api';

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Tên môn học phải có ít nhất 2 ký tự.",
  }),
  code: z.string().min(2, {
    message: "Mã môn học phải có ít nhất 2 ký tự.",
  }),
  description: z.string().optional(),
  teacherId: z.string().optional(),
});

type SubjectFormValues = z.infer<typeof formSchema>;

interface AddSubjectDialogProps {
  children: React.ReactNode;
  onSubjectAdded: (subject: any) => void;
}

export default function AddSubjectDialog({ children, onSubjectAdded }: AddSubjectDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  
  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      teacherId: "",
    },
  });
  
  useEffect(() => {
    async function fetchTeachers() {
      try {
        const teachersData = await UserAPI.getByRole('teacher');
        setTeachers(teachersData);
      } catch (error) {
        console.error("Lỗi tải giáo viên:", error);
      }
    }
    
    // Fetch teachers when dialog opens
    if (open) {
      fetchTeachers();
    }
  }, [open]);
  
  function onSubmit(values: SubjectFormValues) {
    const newSubject = {
      ...values,
      id: uuidv4(), // Generate a unique ID (this would normally be done by the server)
    };
    
    onSubjectAdded(newSubject);
    toast({
      title: "Môn học đã được thêm",
      description: `${values.name} đã được thêm thành công.`,
    });
    
    form.reset();
    setOpen(false);
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Thêm môn học mới</DialogTitle>
          <DialogDescription>
            Tạo một môn học mới trong hệ thống học tập. Điền thông tin bên dưới.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: any }) => (
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
              render={({ field }: { field: any }) => (
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
              name="description"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Nhập một mô tả ngắn gọn về môn học" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="teacherId"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Gán giáo viên (Tùy chọn)</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giáo viên" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teachers.map(teacher => (
                        <SelectItem key={teacher.id} value={teacher.id}>
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
              <Button type="submit">Thêm môn học</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
