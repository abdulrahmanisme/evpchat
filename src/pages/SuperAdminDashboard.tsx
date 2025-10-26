import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Crown, Shield, Users, FileText, Calendar, CheckCircle } from "lucide-react";

// Lazy load heavy components to reduce initial bundle size
const SuperAdminOverview = lazy(() => import("@/components/superadmin/SuperAdminOverview").then(module => ({ default: module.SuperAdminOverview })));
const SuperAdminUsers = lazy(() => import("@/components/superadmin/SuperAdminUsers").then(module => ({ default: module.SuperAdminUsers })));
const SuperAdminAdmins = lazy(() => import("@/components/superadmin/SuperAdminAdmins").then(module => ({ default: module.SuperAdminAdmins })));
const SuperAdminReflectionSubmissions = lazy(() => import("@/components/superadmin/SuperAdminReflectionSubmissions").then(module => ({ default: module.SuperAdminReflectionSubmissions })));
const SuperAdminEventManagement = lazy(() => import("@/components/superadmin/SuperAdminEventManagement").then(module => ({ default: module.SuperAdminEventManagement })));
const SuperAdminAttendanceManagement = lazy(() => import("@/components/superadmin/SuperAdminAttendanceManagement").then(module => ({ default: module.SuperAdminAttendanceManagement })));
const AdminOfficeAttendance = lazy(() => import("@/components/admin/AdminOfficeAttendance").then(module => ({ default: module.AdminOfficeAttendance })));
const AttendanceSettings = lazy(() => import("@/components/admin/AttendanceSettings").then(module => ({ default: module.AttendanceSettings })));

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
        
        <Tabs defaultValue="office-attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="office-attendance" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Office Attendance
            </TabsTrigger>
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
            <TabsTrigger value="reflections" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reflections
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="attendance" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Event Attendance
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="office-attendance">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <AdminOfficeAttendance />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="overview">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <SuperAdminOverview />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="users">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <SuperAdminUsers />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="admins">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <SuperAdminAdmins />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="reflections">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <SuperAdminReflectionSubmissions />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="events">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <SuperAdminEventManagement />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="attendance">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <SuperAdminAttendanceManagement />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="settings">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <AttendanceSettings />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
