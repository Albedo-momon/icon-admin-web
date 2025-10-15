import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { PersonalInfo } from "@/components/profile/PersonalInfo";
import { SecuritySettings } from "@/components/profile/SecuritySettings";
import { PreferencesSettings } from "@/components/profile/PreferencesSettings";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const Profile = () => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["overview", "personal", "security", "preferences"].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);
  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text-heading mb-2">Profile</h1>
          <p className="text-text-muted">Manage your account information.</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger 
              value="overview"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="personal"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
            >
              Personal Info
            </TabsTrigger>
            <TabsTrigger 
              value="security"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
            >
              Security
            </TabsTrigger>
            <TabsTrigger 
              value="preferences"
              className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-transparent rounded-none"
            >
              Preferences
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <ProfileOverview />
          </TabsContent>

          <TabsContent value="personal">
            <PersonalInfo />
          </TabsContent>

          <TabsContent value="security">
            <SecuritySettings />
          </TabsContent>

          <TabsContent value="preferences">
            <PreferencesSettings />
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default Profile;