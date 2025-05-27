"use client";

import { useState, useEffect } from 'react';
import GradeDisplayTable from '@/components/grades/grade-display-table';
import { useAuth } from '@/hooks/use-auth';
import { GradeAPI } from '@/lib/api';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentGradesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchGrades() {
      if (user?.id) {
        try {
          const gradeData = await GradeAPI.getAllForStudent(user.id);
          setGrades(gradeData);
        } catch (error) {
          console.error("Error fetching grades:", error);
        } finally {
          setLoading(false);
        }
      }
    }
    
    if (!authLoading && user) {
      fetchGrades();
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2 text-muted-foreground">Đang tải điểm số...</p>
      </div>
    );
  }

  if (!user || user.role !== 'student') {
    return (
       <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center">
            <AlertTriangle className="mr-2 h-6 w-6" /> Không có quyền truy cập
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>Bạn không có quyền truy cập trang này.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <GradeDisplayTable
        grades={grades}
        title={`Điểm số của ${user.name}`}
        description="Đây là tổng quan hiệu suất học tập của bạn trong tất cả các môn học."
      />
    </div>
  );
}
