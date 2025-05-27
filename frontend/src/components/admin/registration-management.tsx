"use client";

import { useState, useEffect } from 'react';
import { RegistrationAPI } from '@/lib/api';
import { RegistrationRequest } from '@/lib/types';
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
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Loader2, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Filter,
  FileText,
  Search,
  Check,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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

export default function RegistrationManagement() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RegistrationRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'approve' | 'reject' | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [academicYear] = useState('2023-2024');

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const filterValue = statusFilter === 'all' ? undefined : statusFilter;
      const data = await RegistrationAPI.getAllRequests(filterValue, academicYear);
      setRequests(data);
    } catch (error) {
      console.error('Lỗi khi tải yêu cầu:', error);
      toast({
        title: "Lỗi",
        description: "Không thể tải yêu cầu đăng ký. Vui lòng thử lại.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcessRequest = async (request: RegistrationRequest, action: 'approve' | 'reject') => {
    setSelectedRequest(request);
    setActionType(action);
    setAdminNote('');
    setDialogOpen(true);
  };

  const confirmProcessRequest = async () => {
    if (!selectedRequest || !actionType) return;
    
    try {
      setProcessing(selectedRequest.id);
      
      // Kiểm tra xem có user.id hợp lệ không
      const adminId = user?.id;
      if (!adminId) {
        console.error('User ID không hợp lệ');
        toast({
          title: "Lỗi",
          description: "Admin ID không tồn tại. Vui lòng đăng xuất và đăng nhập lại.",
          variant: "destructive"
        });
        return;
      }
      
      console.log('Sử dụng ID admin cho yêu cầu:', adminId);
      
      await RegistrationAPI.processRequest(
        selectedRequest.id,
        actionType,
        adminId,
        adminNote.trim() || undefined
      );
      
      toast({
        title: `Yêu cầu ${actionType === 'approve' ? 'Đã được phê duyệt' : 'Đã bị từ chối'}`,
        description: `Yêu cầu đăng ký cho ${selectedRequest.subject?.name} đã được ${actionType}d.`,
      });
      
      // Reset form and reload data
      setDialogOpen(false);
      setSelectedRequest(null);
      setActionType(null);
      setAdminNote('');
      loadRequests();
    } catch (error: any) {
      console.error('Lỗi xử lý yêu cầu:', error);
      toast({
        title: "Lỗi",
        description: error.message || `Không thể ${actionType} yêu cầu. Vui lòng thử lại.`,
        variant: "destructive"
      });
    } finally {
      setProcessing(null);
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

  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.student?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.subject?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.student?.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />
        <span>Đang tải yêu cầu đăng ký...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng yêu cầu</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{requests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang chờ</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã phê duyệt</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã từ chối</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Quản lý yêu cầu đăng ký
          </CardTitle>
          <CardDescription>
            Xem và xử lý yêu cầu đăng ký của sinh viên cho năm học {academicYear}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name, subject, or email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="pending">Đang chờ</SelectItem>
                <SelectItem value="approved">Đã phê duyệt</SelectItem>
                <SelectItem value="rejected">Đã từ chối</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredRequests.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sinh viên</TableHead>
                    <TableHead>Môn học</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Yêu cầu vào</TableHead>
                    <TableHead>Lý do</TableHead>
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map(request => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.student?.name}</div>
                          <div className="text-sm text-muted-foreground">{request.student?.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.subject?.name}</div>
                          <div className="text-sm text-muted-foreground">{request.subject?.credits} credits</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(request.status)}</TableCell>
                      <TableCell>{new Date(request.requestedAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="max-w-48 truncate" title={request.reason}>
                          {request.reason || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {request.status === 'pending' ? (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-600 border-green-600 hover:bg-green-50"
                              onClick={() => handleProcessRequest(request, 'approve')}
                              disabled={processing === request.id}
                            >
                              {processing === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-600 border-red-600 hover:bg-red-50"
                              onClick={() => handleProcessRequest(request, 'reject')}
                              disabled={processing === request.id}
                            >
                              {processing === request.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <X className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {request.approvedAt ? `Processed ${new Date(request.approvedAt).toLocaleDateString()}` : 'Processed'}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {requests.length === 0 
                ? "Không tìm thấy yêu cầu đăng ký."
                : "Không có yêu cầu nào phù hợp với tiêu chí tìm kiếm của bạn."
              }
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Request Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === 'approve' ? 'Approve' : 'Reject'} Registration Request
            </DialogTitle>
            <DialogDescription>
              {actionType === 'approve' 
                ? `Approve ${selectedRequest?.student?.name}'s registration for ${selectedRequest?.subject?.name}. The student will be automatically enrolled upon approval.`
                : `Reject ${selectedRequest?.student?.name}'s registration for ${selectedRequest?.subject?.name}. Please provide a reason for rejection.`
              }
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adminNote">
                {actionType === 'approve' ? 'Approval Note (Optional)' : 'Rejection Reason'}
              </Label>
              <Textarea
                id="adminNote"
                placeholder={
                  actionType === 'approve' 
                    ? "Thêm bất kỳ ghi chú nào về sự phê duyệt này..."
                    : "Giải thích tại sao yêu cầu này đang bị từ chối..."
                }
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                rows={3}
                required={actionType === 'reject'}
              />
            </div>
            {selectedRequest?.reason && (
              <div className="space-y-2">
                <Label>Lý do của sinh viên</Label>
                <div className="p-3 bg-muted rounded-md text-sm">
                  {selectedRequest.reason}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Hủy bỏ
            </Button>
            <Button 
              onClick={confirmProcessRequest}
              disabled={processing === selectedRequest?.id || (actionType === 'reject' && !adminNote.trim())}
              variant={actionType === 'approve' ? 'default' : 'destructive'}
            >
              {processing === selectedRequest?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang xử lý...
                </>
              ) : (
                `${actionType === 'approve' ? 'Approve' : 'Reject'} Request`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 