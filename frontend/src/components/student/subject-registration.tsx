"use client";

import { useState, useEffect } from 'react';
import { RegistrationAPI } from '@/lib/api';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, BookOpen, Plus, Clock, CheckCircle, XCircle, Tag, Search } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Sửa lại định nghĩa interface để đảm bảo có code
interface Subject {
  id: string;
  name: string;
  code?: string;
  credits?: number;
  description?: string;
}

interface RegistrationRequest {
  id: string;
  studentId: string;
  subjectId: string;
  status: string;
  reason?: string;
  adminNote?: string;
  requestedAt: string;
  subject?: Subject;
}

export default function SubjectRegistration() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [registrationRequests, setRegistrationRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [reason, setReason] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [academicYear] = useState('2023-2024');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      const [subjects, requests] = await Promise.all([
        RegistrationAPI.getAvailableSubjects(user.id, academicYear),
        RegistrationAPI.getStudentRequests(user.id, undefined, academicYear)
      ]);
      
      setAvailableSubjects(subjects);
      setRegistrationRequests(requests);
    } catch (error) {
      console.error('Lỗi tải dữ liệu:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải dữ liệu đăng ký. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitRegistration = async () => {
    if (!selectedSubject || !user?.id) return;
    
    try {
      setSubmitting(true);
      
      await RegistrationAPI.createRequest({
        studentId: user.id,
        subjectId: selectedSubject.id,
        academicYear,
        reason: reason.trim() || undefined
      });
      
      toast({
        title: "Yêu cầu đăng ký đã được gửi",
        description: `Yêu cầu đăng ký cho ${selectedSubject.name} đã được gửi để phê duyệt.`,
      });
      
      // Reset form and reload data
      setDialogOpen(false);
      setSelectedSubject(null);
      setReason('');
      loadData();
    } catch (error: any) {
      console.error('Lỗi gửi yêu cầu đăng ký:', error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể gửi yêu cầu đăng ký. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600"><Clock className="mr-1 h-3 w-3" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="text-green-600 border-green-600"><CheckCircle className="mr-1 h-3 w-3" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="text-red-600 border-red-600"><XCircle className="mr-1 h-3 w-3" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredSubjects = availableSubjects.filter(subject =>
    subject.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subject.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Đang tải dữ liệu đăng ký...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Available Subjects for Registration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BookOpen className="mr-2 h-5 w-5" />
            Môn học có thể đăng ký
          </CardTitle>
          <CardDescription>
            Chọn môn học bạn muốn đăng ký cho năm học {academicYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm môn học..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {filteredSubjects.length > 0 ? (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên môn học</TableHead>
                      <TableHead>Số tín chỉ</TableHead>
                      <TableHead>Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSubjects.map(subject => (
                      <TableRow key={subject.id}>
                        <TableCell className="font-medium">{subject.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            <Tag className="mr-1 h-3 w-3" />
                            {subject.credits}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Dialog open={dialogOpen && selectedSubject?.id === subject.id} onOpenChange={(open) => {
                            if (!open) {
                              setDialogOpen(false);
                              setSelectedSubject(null);
                              setReason('');
                            }
                          }}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                onClick={() => {
                                  setSelectedSubject(subject);
                                  setDialogOpen(true);
                                }}
                              >
                                <Plus className="mr-1 h-4 w-4" />
                                Đăng ký
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Đăng ký {selectedSubject?.name}</DialogTitle>
                                <DialogDescription>
                                  Gửi yêu cầu đăng ký cho môn học này. Yêu cầu của bạn sẽ được xem xét bởi quản trị viên.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label htmlFor="reason">Lý do đăng ký (Tùy chọn)</Label>
                                  <Textarea
                                    id="reason"
                                    placeholder="Giải thích tại sao bạn muốn đăng ký môn học này..."
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={3}
                                  />
                                </div>
                              </div>
                              <DialogFooter>
                                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                                  Hủy bỏ
                                </Button>
                                <Button onClick={handleSubmitRegistration} disabled={submitting}>
                                  {submitting ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Đang gửi...
                                    </>
                                  ) : (
                                    'Gửi yêu cầu'
                                  )}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {availableSubjects.length === 0 
                  ? "Tất cả các môn học có thể đăng ký đã được đăng ký hoặc yêu cầu."
                  : "Không tìm thấy môn học phù hợp với tìm kiếm của bạn."
                }
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Registration Requests Status */}
      <Card>
        <CardHeader>
          <CardTitle>Yêu cầu đăng ký của tôi</CardTitle>
          <CardDescription>
            Theo dõi trạng thái của yêu cầu đăng ký môn học của bạn
          </CardDescription>
        </CardHeader>
        <CardContent>
          {registrationRequests.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Môn học</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Yêu cầu vào</TableHead>
                    <TableHead>Ghi chú quản trị viên</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrationRequests.map(request => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">
                        {request.subject?.name || 'Môn học không xác định'}
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                      <TableCell>{request.adminNote || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Không có yêu cầu đăng ký nào được tìm thấy.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 