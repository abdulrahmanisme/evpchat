import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface LeaderboardEntry {
  id: string;
  name: string;
  campus_name: string;
  total_score: number;
  verified_count: number;
  pending_count: number;
}

const Leaderboard = () => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, campus_name, total_score')
        .order('total_score', { ascending: false });

      if (profilesError) throw profilesError;

      const entriesWithCounts = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: submissions } = await supabase
            .from('submissions')
            .select('status')
            .eq('user_id', profile.id);

          const verified_count = submissions?.filter(s => s.status === 'verified').length || 0;
          const pending_count = submissions?.filter(s => s.status === 'pending').length || 0;

          return {
            ...profile,
            verified_count,
            pending_count,
          };
        })
      );

      setEntries(entriesWithCounts);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Leaderboard</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Campus</TableHead>
                    <TableHead className="text-center">Score</TableHead>
                    <TableHead className="text-center">Verified</TableHead>
                    <TableHead className="text-center">Pending</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry, index) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-bold">
                        {index === 0 && "🥇"}
                        {index === 1 && "🥈"}
                        {index === 2 && "🥉"}
                        {index > 2 && index + 1}
                      </TableCell>
                      <TableCell className="font-medium">{entry.name}</TableCell>
                      <TableCell>{entry.campus_name}</TableCell>
                      <TableCell className="text-center font-bold">
                        {entry.total_score}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="default">{entry.verified_count}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{entry.pending_count}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;