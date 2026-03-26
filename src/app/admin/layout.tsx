import { Montserrat } from 'next/font/google';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import type { Metadata } from 'next';
import '../globals.css';

const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Admin — FootJersey',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr" className={montserrat.variable}>
      <body className="font-sans bg-[#0a0a0a] text-white min-h-screen">
        <AdminGuard>
          <div className="flex min-h-screen">
            <AdminSidebar />
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </AdminGuard>
      </body>
    </html>
  );
}
