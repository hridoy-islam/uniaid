import { TopNav } from '@/components/shared/top-nav';
import { SideNav } from '@/components/shared/side-nav';
// import AutoLogout from "../shared/auto-logout";
import { Toaster } from '@/components/ui/toaster';
import { useSelector } from 'react-redux';

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // Teachers only use My Slots, so they get no nav bar
  const isTeacher =
    useSelector((state: any) => state.auth?.user?.role) === 'teacher';
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <AutoLogout inactivityLimit={8 * 60 * 60 * 1000} /> */}
      <TopNav />
      {!isTeacher && <SideNav />}

      <main className="mx-auto px-4 py-6">{children}</main>
      <Toaster />
    </div>
  );
}
