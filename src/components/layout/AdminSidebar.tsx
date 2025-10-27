import { LayoutDashboard, Smartphone, Users, Monitor, FileText, Bell, X } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { useAuthStore } from "@/stores/authStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const navItems = [
  { name: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { name: "Requests", icon: FileText, path: "/requests" },
  { name: "CSM", icon: Smartphone, path: "/manage-user-app" },
  { name: "Agents", icon: Users, path: "/agents" },
  { name: "Notifications", icon: Bell, path: "/notifications", showBadge: true },
];

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const { items } = useNotificationsStore();
  const { user } = useAuthStore();
  const unreadCount = items.filter(item => !item.read).length;

  // Generate initials from user name
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-sidebar text-sidebar-foreground flex flex-col h-screen border-r border-gray-400 dark:border-gray-600 transition-transform duration-300 ease-in-out z-50",
        // Desktop: sticky positioning
        "md:sticky md:top-0 md:translate-x-0",
        // Mobile: fixed positioning with transform
        "fixed top-0 left-0 md:relative",
        isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        {/* Mobile close button */}
        <div className="md:hidden flex justify-end p-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-sidebar-foreground hover:bg-sidebar-accent"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Monitor className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">ICON</h1>
            <p className="text-xs text-sidebar-foreground/70">COMPUTERS</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose} // Close mobile sidebar on navigation
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative min-h-[44px]",
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
              {item.showBadge && unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto h-5 px-1.5 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Profile Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2 min-h-[44px]">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">
                {user ? getInitials(user.name) : 'AU'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">
                {user?.name || 'Admin User'}
              </p>
              <p className="text-xs text-sidebar-foreground/50 truncate">
                {user?.email || 'admin@iconcomputers.com'}
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
