import RegistrationManagement from '@/components/admin/registration-management';

export default function AdminRegistrationsPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Quản lý đăng ký môn học</h1>
        <p className="text-muted-foreground">
          Xem và xử lý yêu cầu đăng ký môn học của học sinh
        </p>
      </div>
      
      <RegistrationManagement />
    </div>
  );
} 