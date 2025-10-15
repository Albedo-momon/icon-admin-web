import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export function SecuritySettings() {
  const [password, setPassword] = useState({ current: "", new: "", confirm: "" });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);

  const calculatePasswordStrength = (pwd: string): number => {
    if (!pwd) return 0;
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25;
    if (/[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) strength += 25;
    return strength;
  };

  const strength = calculatePasswordStrength(password.new);
  const strengthColor = strength < 50 ? "bg-destructive" : strength < 75 ? "bg-warning" : "bg-success";

  const handlePasswordChange = () => {
    if (password.new.length < 8) {
      setError("Password must be at least 8 characters");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    if (password.new !== password.confirm) {
      setError("Passwords don't match");
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setError("");
    toast.success("Password changed successfully!", {
      description: "Your password has been updated.",
    });
    setPassword({ current: "", new: "", confirm: "" });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-card-foreground">Change Password</CardTitle>
          <CardDescription className="text-muted-foreground">Update your password to keep your account secure.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            animate={shake ? { x: [-4, 4, -4, 4, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <div className="space-y-2">
              <Label htmlFor="currentPassword" className="text-card-foreground">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPassword.current ? "text" : "password"}
                  value={password.current}
                  onChange={(e) => setPassword({ ...password, current: e.target.value })}
                  className="bg-background border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground"
                >
                  {showPassword.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="text-card-foreground">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPassword.new ? "text" : "password"}
                  value={password.new}
                  onChange={(e) => setPassword({ ...password, new: e.target.value })}
                  className="bg-background border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground"
                >
                  {showPassword.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password.new && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-1"
                >
                  <Progress value={strength} className={`h-2 ${strengthColor}`} />
                  <p className="text-xs text-muted-foreground">
                    Password strength: {strength < 50 ? "Weak" : strength < 75 ? "Medium" : "Strong"}
                  </p>
                </motion.div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-card-foreground">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPassword.confirm ? "text" : "password"}
                  value={password.confirm}
                  onChange={(e) => setPassword({ ...password, confirm: e.target.value })}
                  className="bg-background border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground"
                >
                  {showPassword.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </motion.div>
          <Button onClick={handlePasswordChange} type="button">
            Update Password
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}