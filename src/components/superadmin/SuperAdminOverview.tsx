import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crown, Users, Shield, FileText, TrendingUp, AlertTriangle } from "lucide-react";

interface SystemStats {
  totalUsers: number;
  totalAdmins: number;
  totalCampusLeads: number;
  totalReflections: number;
  evaluatedReflections: number;
  totalCampuses: number;
  recentActivity: number;
}

export const SuperAdminOverview = () => {
  const [stats, setStats] = useState<SystemStats>({
    totalUsers: 0,
    totalAdmins: 0,
    totalCampusLeads: 0,
    totalReflections: 0,
    evaluatedReflections: 0,
    totalCampuses: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      // Get all users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, campus_name, created_at');

      // Get all roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role');

      // Get all reflections
      const { data: reflections } = await supabase
        .from('reflections')
        .select('effort_score, quality_score, created_at');

      // Calculate stats
      const campuses = new Set(profiles?.map(p => p.campus_name) || []);
      const adminCount = roles?.filter(r => r.role === 'admin').length || 0;
      const campusLeadCount = roles?.filter(r => r.role === 'campus_lead').length || 0;
      const evaluatedCount = reflections?.filter(r => r.effort_score && r.quality_score).length || 0;
      
      // Recent activity (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentReflections = reflections?.filter(r => 
        new Date(r.created_at) > weekAgo
      ).length || 0;

      setStats({
        totalUsers: profiles?.length || 0,
        totalAdmins: adminCount,
        totalCampusLeads: campusLeadCount,
        totalReflections: reflections?.length || 0,
        evaluatedReflections: evaluatedCount,
        totalCampuses: campuses.size,
        recentActivity: recentReflections,
      });
    } catch (error) {
      console.error('Error loading system stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.totalUsers}</div>
            <p className="text-xs text-blue-700">
              {stats.totalAdmins} admins, {stats.totalCampusLeads} campus leads
            </p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Admins</CardTitle>
            <Crown className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{stats.totalAdmins}</div>
            <p className="text-xs text-yellow-700">System administrators</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Campus Leads</CardTitle>
            <Shield className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.totalCampusLeads}</div>
            <p className="text-xs text-green-700">Active campus leaders</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Campuses</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats.totalCampuses}</div>
            <p className="text-xs text-purple-700">Active campuses</p>
          </CardContent>
        </Card>
      </div>

      {/* Reflections Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Total Reflections</CardTitle>
            <FileText className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.totalReflections}</div>
            <p className="text-xs text-orange-700">All time reflections</p>
          </CardContent>
        </Card>

        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800">AI Evaluated</CardTitle>
            <Shield className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-900">{stats.evaluatedReflections}</div>
            <p className="text-xs text-emerald-700">With AI scores</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Recent Activity (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold">{stats.recentActivity}</div>
            <div className="text-sm text-muted-foreground">
              New reflections in the past week
            </div>
            {stats.recentActivity > 0 && (
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
