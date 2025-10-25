import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const AdminOverview = () => {
  const [stats, setStats] = useState({
    totalLeads: 0,
    totalReflections: 0,
    evaluatedReflections: 0,
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

      const { data: reflections } = await supabase
        .from('reflections')
        .select('effort_score, quality_score');

      const campuses = new Set(profiles?.map(p => p.campus_name) || []);

      setStats({
        totalLeads: profiles?.length || 0,
        totalReflections: reflections?.length || 0,
        evaluatedReflections: reflections?.filter(r => r.effort_score && r.quality_score).length || 0,
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
          <CardTitle className="text-sm font-medium">Total Reflections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalReflections}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">AI Evaluated</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.evaluatedReflections}</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Campuses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.totalCampuses}</div>
        </CardContent>
      </Card>
    </div>
  );
};