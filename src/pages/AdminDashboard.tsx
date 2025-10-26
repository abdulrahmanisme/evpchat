import { useEffect, useState, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

// Lazy load heavy components to reduce initial bundle size
const AdminCampuses = lazy(() => import("@/components/admin/AdminCampuses").then(module => ({ default: module.AdminCampuses })));
const AdminReflectionSubmissions = lazy(() => import("@/components/admin/AdminReflectionSubmissions").then(module => ({ default: module.AdminReflectionSubmissions })));
const AdminEventManagement = lazy(() => import("@/components/admin/AdminEventManagement").then(module => ({ default: module.AdminEventManagement })));
const AdminAttendanceManagement = lazy(() => import("@/components/admin/AdminAttendanceManagement").then(module => ({ default: module.AdminAttendanceManagement })));
const AdminOfficeAttendance = lazy(() => import("@/components/admin/AdminOfficeAttendance").then(module => ({ default: module.AdminOfficeAttendance })));
const AttendanceSettings = lazy(() => import("@/components/admin/AttendanceSettings").then(module => ({ default: module.AttendanceSettings })));

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!data) {
        toast.error("Access denied. Admin privileges required.");
        navigate('/dashboard');
        return;
      }

      setLoading(false);
    };

    checkAdmin();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Admin Dashboard</h1>
        <Tabs defaultValue="office-attendance" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="office-attendance">Office Attendance</TabsTrigger>
            <TabsTrigger value="reflection-submissions">Reflection Submissions</TabsTrigger>
            <TabsTrigger value="events">Event Management</TabsTrigger>
            <TabsTrigger value="attendance">Event Attendance</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="campuses">Campus Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="office-attendance">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <AdminOfficeAttendance />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="reflection-submissions">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <AdminReflectionSubmissions />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="events">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <AdminEventManagement />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="attendance">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <AdminAttendanceManagement />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="settings">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <AttendanceSettings />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="campuses">
            <Suspense fallback={<div className="text-center py-8">Loading...</div>}>
              <AdminCampuses />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;