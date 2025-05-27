import type { ReactNode } from 'react';
import { School } from 'lucide-react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 selection:bg-primary/20">
       <div className="flex items-center gap-2 mb-8">
          <School className="h-10 w-10 text-primary" />
          <h1 className="text-4xl font-bold text-primary">GradeView</h1>
        </div>
      {children}
      <p className="mt-8 text-sm text-muted-foreground">
        Chào mừng đến với GradeView. Vui lòng đăng nhập để tiếp tục.
      </p>
    </div>
  );
}
