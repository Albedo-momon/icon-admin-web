import { Search, Bell, Settings, LogOut, User, Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationsDrawer } from "@/components/notifications/NotificationsDrawer";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationsStore } from "@/stores/notificationsStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface AdminTopbarProps {
  onMenuClick?: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  const { user, logout } = useAuthStore();
  const { items } = useNotificationsStore();
  const navigate = useNavigate();
  const [searchExpanded, setSearchExpanded] = useState(false);

  const unreadCount = items.filter(item => !item.read).length;

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out");
      navigate("/login");
    } catch (error) {
      console.error('Logout error:', error);
      toast.error("Failed to sign out");
    }
  };

  return (
    <header className="sticky h-16 top-0 z-10 w-full bg-background shadow-md dark:bg-gray-900 dark:shadow-lg">
      <div className="h-full px-6 lg:px-6 md:px-4 sm:px-3 xs:px-3 flex items-center justify-between">
        {/* Left section - Hamburger + Greeting */}
        <div className="flex items-center gap-4">
          {/* Mobile hamburger menu */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuClick}
            className="md:hidden h-10 w-10"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Greeting - hidden on small screens when search is expanded */}
          <div className={`${searchExpanded ? 'hidden' : 'block'} md:block`}>
            <h2 className="text-lg font-semibold text-foreground hidden sm:block">
              Hello, {user?.name || 'Admin'} 👋
            </h2>
            <h2 className="text-base font-semibold text-foreground sm:hidden">
              {user?.name || 'Admin'} 👋
            </h2>
            <p className="text-sm text-muted-foreground hidden md:block">Dashboard is updated</p>
          </div>
        </div>

        {/* Right section - Actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Search - responsive behavior */}
          <div className="flex items-center">
            {/* Desktop search */}
            <div className="relative w-80 hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search..."
                className="pl-10 bg-secondary/50 border-gray-200"
              />
            </div>

            {/* Mobile search */}
            <div className="md:hidden">
              {searchExpanded ? (
                <div className="fixed top-16 left-0 right-0 bg-background border-b p-4 z-50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Search..."
                      className="pl-10 w-full"
                      autoFocus
                      onBlur={() => setSearchExpanded(false)}
                    />
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchExpanded(true)}
                  className="h-10 w-10"
                >
                  <Search className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Notification Bell */}
          <NotificationsDrawer>
            <Button variant="ghost" size="icon" className="relative h-10 w-10">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
              )}
            </Button>
          </NotificationsDrawer>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className="rounded-full hover:bg-slate-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 h-10 w-10"
                aria-label="Settings"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name || 'Admin User'}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email || 'admin@example.com'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="hover:shadow-lg dark:hover:shadow-gray-500/20 transition-all duration-300 min-h-[44px]"
                onClick={() => navigate('/profile')}
              >
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="hover:shadow-lg dark:hover:shadow-gray-500/20 transition-all duration-300 min-h-[44px]"
                onClick={() => navigate('/profile?tab=preferences')}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive cursor-pointer focus:bg-transparent hover:bg-transparent min-h-[44px]"
                onClick={handleLogout}
                aria-label="Logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
                <span className="ml-auto text-xs text-muted-foreground">⌘⇧L</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}