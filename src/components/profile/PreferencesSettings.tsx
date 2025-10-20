import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function PreferencesSettings() {
  const [language, setLanguage] = useState("en");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('user-language');
    const savedEmailNotifications = localStorage.getItem('email-notifications');
    const savedInAppNotifications = localStorage.getItem('inapp-notifications');

    if (savedLanguage) setLanguage(savedLanguage);
    if (savedEmailNotifications) setEmailNotifications(JSON.parse(savedEmailNotifications));
    if (savedInAppNotifications) setInAppNotifications(JSON.parse(savedInAppNotifications));
  }, []);

  const handleSave = () => {
    // Save preferences to localStorage
    localStorage.setItem('user-language', language);
    localStorage.setItem('email-notifications', JSON.stringify(emailNotifications));
    localStorage.setItem('inapp-notifications', JSON.stringify(inAppNotifications));
    
    toast.success("Preferences saved!", {
      description: "Your preferences have been updated.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Language & Region</CardTitle>
          <CardDescription className="text-muted-foreground">Select your preferred language and regional settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language" className="text-card-foreground">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Notifications</CardTitle>
          <CardDescription className="text-muted-foreground">Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email"
              checked={emailNotifications}
              onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="email" className="font-normal cursor-pointer text-card-foreground">
              Email updates
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="inApp"
              checked={inAppNotifications}
              onCheckedChange={(checked) => setInAppNotifications(checked as boolean)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="inApp" className="font-normal cursor-pointer text-card-foreground">
              In-app alerts
            </Label>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave}>Save Preferences</Button>
    </motion.div>
  );
}