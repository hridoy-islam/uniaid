import { TopNav } from '@/components/shared/top-nav';
import { SideNav } from '@/components/shared/side-nav';
// import AutoLogout from "../shared/auto-logout";
import { Toaster } from '@/components/ui/toaster';
import { useSelector } from 'react-redux';
import { useSlotAccess } from '@/hooks/use-slot-access';

export default function AdminLayout({
  children
}: {
  children: React.ReactNode;
}) {
  // A teacher with only My Slots needs no nav bar. It shows once a
  // designation lets them view Teacher Slots or Slot Templates.
  const isTeacher =
    useSelector((state: any) => state.auth?.user?.role) === 'teacher';
  const access = useSlotAccess();
  const showNav =
    !isTeacher || access.teacherSlot.view || access.slotTemplate.view;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* <AutoLogout inactivityLimit={8 * 60 * 60 * 1000} /> */}
      <TopNav />
      {showNav && <SideNav />}

      <main className="mx-auto px-4 py-6">{children}</main>
      <Toaster />
    </div>
  );
}
