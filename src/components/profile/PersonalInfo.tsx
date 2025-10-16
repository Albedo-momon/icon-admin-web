import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";

export function PersonalInfo() {
  const { user } = useAuthStore();
  const [formData, setFormData] = useState({
    fullName: user?.name || "Admin User",
    email: user?.email || "admin@example.com",
    phone: "+1 (555) 123-4567",
    company: "Acme Corporation",
    location: "San Francisco, CA",
  });

  useEffect(() => {
    const saved = localStorage.getItem("profileData");
    if (saved) {
      setFormData(JSON.parse(saved));
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleSave = () => {
    localStorage.setItem("profileData", JSON.stringify(formData));
    toast.success("Profile updated successfully!", {
      description: "Your changes have been saved.",
    });
  };

  const handleCancel = () => {
    const saved = localStorage.getItem("profileData");
    if (saved) {
      setFormData(JSON.parse(saved));
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
      }));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-gray-100 border-gray-200">
        <CardHeader>
          <CardTitle className="text-text-heading">Personal Information</CardTitle>
          <CardDescription>Update your personal details and contact information.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-text-body">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-white border-gray-300 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-text-body">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white border-gray-300 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-text-body">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-white border-gray-300 focus:ring-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company" className="text-text-body">Company</Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="bg-white border-gray-300 focus:ring-primary"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="location" className="text-text-body">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="bg-white border-gray-300 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleSave} type="button">
                Save Changes
              </Button>
              <Button variant="secondary" type="button" onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}