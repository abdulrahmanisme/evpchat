import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuperAdminOverview } from "@/components/superadmin/SuperAdminOverview";
import { SuperAdminUsers } from "@/components/superadmin/SuperAdminUsers";
import { SuperAdminAdmins } from "@/components/superadmin/SuperAdminAdmins";
import { SuperAdminSubmissions } from "@/components/superadmin/SuperAdminSubmissions";
import { SuperAdminSystem } from "@/components/superadmin/SuperAdminSystem";
import { toast } from "sonner";
import { Crown, Shield, Users, FileText, Settings } from "lucide-react";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkSuperAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'superadmin')
        .maybeSingle();

      if (!data) {
        toast.error("Access denied. Superadmin privileges required.");
        navigate('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkSuperAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <div className="flex items-center justify-center gap-2">
            <Crown className="h-6 w-6 text-yellow-500 animate-spin" />
            <p className="text-muted-foreground">Verifying superadmin access...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Crown className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
            Superadmin Dashboard
          </h1>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Campus Leads
            </TabsTrigger>
            <TabsTrigger value="admins" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Admins
            </TabsTrigger>
            <TabsTrigger value="submissions" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Submissions
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <SuperAdminOverview />
          </TabsContent>
          
          <TabsContent value="users">
            <SuperAdminUsers />
          </TabsContent>
          
          <TabsContent value="admins">
            <SuperAdminAdmins />
          </TabsContent>
          
          <TabsContent value="submissions">
            <SuperAdminSubmissions />
          </TabsContent>
          
          <TabsContent value="system">
            <SuperAdminSystem />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
