import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export function PreferencesSettings() {
  const [theme, setTheme] = useState("system");
  const [language, setLanguage] = useState("en");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);

  const handleSave = () => {
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
      <Card className="bg-gray-100 border-gray-200">
        <CardHeader>
          <CardTitle className="text-text-heading">Appearance</CardTitle>
          <CardDescription>Customize how the application looks for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-text-body">Theme</Label>
            <RadioGroup value={theme} onValueChange={setTheme}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="system" id="system" className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <Label htmlFor="system" className="font-normal cursor-pointer text-text-body">
                  System
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="light" id="light" className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <Label htmlFor="light" className="font-normal cursor-pointer text-text-body">
                  Light
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="dark" id="dark" className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary" />
                <Label htmlFor="dark" className="font-normal cursor-pointer text-text-body">
                  Dark
                </Label>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-100 border-gray-200">
        <CardHeader>
          <CardTitle className="text-text-heading">Language & Region</CardTitle>
          <CardDescription>Select your preferred language and regional settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="language" className="text-text-body">Language</Label>
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

      <Card className="bg-gray-100 border-gray-200">
        <CardHeader>
          <CardTitle className="text-text-heading">Notifications</CardTitle>
          <CardDescription>Choose how you want to be notified.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="email"
              checked={emailNotifications}
              onCheckedChange={(checked) => setEmailNotifications(checked as boolean)}
              className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <Label htmlFor="email" className="font-normal cursor-pointer text-text-body">
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
            <Label htmlFor="inApp" className="font-normal cursor-pointer text-text-body">
              In-app alerts
            </Label>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave}>Save Preferences</Button>
    </motion.div>
  );
}