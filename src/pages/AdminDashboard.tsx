import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminCampuses } from "@/components/admin/AdminCampuses";
import { AdminReflectionSubmissions } from "@/components/admin/AdminReflectionSubmissions";
import { AdminEventManagement } from "@/components/admin/AdminEventManagement";
import { AdminAttendanceManagement } from "@/components/admin/AdminAttendanceManagement";
import { toast } from "sonner";

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
        <Tabs defaultValue="reflection-submissions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="reflection-submissions">Reflection Submissions</TabsTrigger>
            <TabsTrigger value="events">Event Management</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="campuses">Campus Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="reflection-submissions">
            <AdminReflectionSubmissions />
          </TabsContent>
          
          <TabsContent value="events">
            <AdminEventManagement />
          </TabsContent>
          
          <TabsContent value="attendance">
            <AdminAttendanceManagement />
          </TabsContent>
          
          <TabsContent value="campuses">
            <AdminCampuses />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;