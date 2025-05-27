"use client";

import type { Grade } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';

interface GradeDisplayTableProps {
  grades: any[]; // Changed to any[] to avoid type issues with API data
  title?: string;
  description?: string;
}

export default function GradeDisplayTable({ grades, title = "Your Grades", description = "Overview of your academic performance." }: GradeDisplayTableProps) {
  if (!grades || grades.length === 0) {
    return (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center"><BookOpen className="mr-2 h-6 w-6 text-primary" /> {title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Không có điểm số để hiển thị tại thời điểm này.</p>
        </CardContent>
      </Card>
    );
  }
  
  const calculateGPA = () => {
    // Calculate GPA based on scores from 0-10 scale
    let totalPoints = 0;
    const numericGrades = grades.filter(g => typeof g.score === 'number');

    if (numericGrades.length === 0) return "N/A";

    totalPoints = numericGrades.reduce((sum, g) => sum + g.score, 0);
    return (totalPoints / numericGrades.length).toFixed(2);
  };

  return (
    <Card className="shadow-xl overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl"><BookOpen className="mr-3 h-7 w-7 text-primary" /> {title}</CardTitle>
        {description && <CardDescription className="text-md">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>
            {grades.length > 0 && `Điểm trung bình: ${calculateGPA()}. `}
            Tổng quan chi tiết về điểm số của bạn. Liên hệ quản trị viên để giải quyết sự mâu thuẫn.
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px] font-semibold text-base">Môn học</TableHead>
              <TableHead className="text-center font-semibold text-base">Điểm số</TableHead>
              <TableHead className="text-center font-semibold text-base">Học kỳ</TableHead>
              <TableHead className="font-semibold text-base">Giáo viên</TableHead>
              <TableHead className="font-semibold text-base">Comment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.map((grade) => {
              // Find subject name from the subject relationship
              const subjectName = grade.subject ? grade.subject.name : 'Không xác định';
              
              // Find teacher name from the teacher relationship
              const teacherName = grade.teacher ? grade.teacher.name : 'Không xác định';

              return (
                <TableRow key={grade.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium py-3">{subjectName}</TableCell>
                  <TableCell className="text-center py-3">{grade.score}</TableCell>
                  <TableCell className="text-center py-3">{grade.term || 'N/A'}</TableCell>
                  <TableCell className="py-3">{teacherName}</TableCell>
                  <TableCell className="py-3">{grade.comment || '-'}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
