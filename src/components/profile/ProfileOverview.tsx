import { motion } from "framer-motion";
import { Camera, Mail, Briefcase, MapPin, Calendar } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";

export function ProfileOverview() {
  const { user } = useAuthStore();
  const [avatarPreview, setAvatarPreview] = useState<string>("https://github.com/shadcn.png");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="bg-card border-border">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Avatar Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-32 w-32 border-4 border-primary/20">
                  <AvatarImage src={avatarPreview} alt="Profile" />
                  <AvatarFallback className="text-2xl">
                    {user?.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'AD'}
                  </AvatarFallback>
                </Avatar>
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="absolute bottom-0 right-0 bg-background border-2 border-border rounded-full p-2 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4 text-muted-foreground" />
                </motion.div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button size="sm" onClick={() => fileInputRef.current?.click()}>
                Change Photo
              </Button>
            </div>

            {/* Info Section */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-text-heading">
                  {user?.name || 'Admin User'}
                </h2>
                <p className="text-text-muted">Senior Administrator</p>
              </div>

              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-info" />
                  <div>
                    <dt className="text-xs text-text-muted">Email</dt>
                    <dd className="text-sm text-text-body font-medium">
                      {user?.email || 'admin@example.com'}
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-info" />
                  <div>
                    <dt className="text-xs text-text-muted">Role</dt>
                    <dd className="text-sm text-text-body font-medium">
                      <Badge variant="secondary" className="bg-gradient-primary text-black">Admin</Badge>
                    </dd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-info" />
                  <div>
                    <dt className="text-xs text-text-muted">Location</dt>
                    <dd className="text-sm text-text-body font-medium">San Francisco, CA</dd>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-info" />
                  <div>
                    <dt className="text-xs text-text-muted">Member Since</dt>
                    <dd className="text-sm text-text-body font-medium">January 2024</dd>
                  </div>
                </div>
              </dl>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}