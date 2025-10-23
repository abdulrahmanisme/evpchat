import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    pendingSubmissions: 0,
    verifiedSubmissions: 0,
    totalCampuses: 0,
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, campus_name');

      const { data: submissions } = await supabase
        .from('submissions')
        .select('status');

      const campuses = new Set(profiles?.map(p => p.campus_name) || []);

      setStats({
        totalLeads: profiles?.length || 0,
        pendingSubmissions: submissions?.filter(s => s.status === 'pending').length || 0,
        verifiedSubmissions: submissions?.filter(s => s.status === 'verified').length || 0,
        totalCampuses: campuses.size,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Campus Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalLeads}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Pending Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.pendingSubmissions}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Verified Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.verifiedSubmissions}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Active Campuses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalCampuses}</div>
        </CardContent>
      </Card>
    </div>
  );
};