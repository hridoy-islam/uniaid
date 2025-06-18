import { TopNav } from "@/components/shared/top-nav"
import { SideNav } from "@/components/shared/side-nav"
// import AutoLogout from "../shared/auto-logout";
import { Toaster } from "@/components/ui/toaster";

export default function AdminLayout({
    children
  }: {
    children: React.ReactNode;
  })  {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* <AutoLogout inactivityLimit={8 * 60 * 60 * 1000} /> */}
      <TopNav />
      <SideNav />

      <main className="px-4 mx-auto py-6">
      {children}
      </main>
      <Toaster />
    </div>
  )
}
