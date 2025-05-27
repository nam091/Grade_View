import SubjectRegistration from '@/components/student/subject-registration';

export default function StudentRegistrationPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Đăng ký môn học</h1>
        <p className="text-muted-foreground">
          Đăng ký môn học và theo dõi yêu cầu đăng ký
        </p>
      </div>
      
      <SubjectRegistration />
    </div>
  );
} 