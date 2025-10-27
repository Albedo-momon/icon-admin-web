import type { ReactNode } from "react";
import { useState } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminTopbar } from "./AdminTopbar";

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col md:ml-64">
        <AdminTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 px-6 lg:px-6 md:px-4 sm:px-3 xs:px-3 py-6">
          {children}
        </main>
      </div>
    </div>
  );
}
