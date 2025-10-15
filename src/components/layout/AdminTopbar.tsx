import { Search, Bell, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function AdminTopbar() {
  return (
    <header className="h-16 bg-card border-b border-gray-200 sticky top-0 z-10">
      <div className="h-full px-6 flex items-center justify-between">
        {/* Greeting */}
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Hello, Admin 👋
          </h2>
          <p className="text-sm text-muted-foreground">Dashboard is updated</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search..."
              className="pl-10 bg-secondary/50 border-gray-200"
            />
          </div>

          {/* Notification Bell */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full" />
          </Button>

          {/* Settings */}
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
