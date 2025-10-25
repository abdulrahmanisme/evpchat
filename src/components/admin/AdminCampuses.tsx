import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface CampusStats {
  campus_name: string;
  lead_count: number;
  avg_score: number;
  verified_submissions: number;
}

export const AdminCampuses = () => {
  const [campuses, setCampuses] = useState<CampusStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampuses();
  }, []);

  const loadCampuses = async () => {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, campus_name, total_score');

      if (!profiles) return;

      const campusMap = new Map<string, CampusStats>();

      for (const profile of profiles) {
        const campus = profile.campus_name;
        if (!campusMap.has(campus)) {
          campusMap.set(campus, {
            campus_name: campus,
            lead_count: 0,
            avg_score: 0,
            verified_submissions: 0,
          });
        }

        const stats = campusMap.get(campus)!;
        stats.lead_count += 1;
        stats.avg_score += profile.total_score;

        const { data: submissions } = await supabase
          .from('submissions')
          .select('status')
          .eq('user_id', profile.id)
          .eq('status', 'verified');

        stats.verified_submissions += submissions?.length || 0;
      }

      const campusArray = Array.from(campusMap.values()).map(stats => ({
        ...stats,
        avg_score: Math.round(stats.avg_score / stats.lead_count),
      }));

      campusArray.sort((a, b) => b.avg_score - a.avg_score);

      setCampuses(campusArray);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top 5 Campus Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Campus</TableHead>
              <TableHead className="text-center">Active Leads</TableHead>
              <TableHead className="text-center">Avg Score</TableHead>
              <TableHead className="text-center">Verified Submissions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campuses.slice(0, 5).map((campus, index) => (
              <TableRow key={campus.campus_name}>
                <TableCell className="font-bold">
                  {index === 0 && "🥇"}
                  {index === 1 && "🥈"}
                  {index === 2 && "🥉"}
                  {index > 2 && index + 1}
                </TableCell>
                <TableCell className="font-medium">{campus.campus_name}</TableCell>
                <TableCell className="text-center">{campus.lead_count}</TableCell>
                <TableCell className="text-center font-bold">{campus.avg_score}</TableCell>
                <TableCell className="text-center">{campus.verified_submissions}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};