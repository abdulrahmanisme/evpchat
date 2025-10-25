import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trophy, Medal, Award, Star, TrendingUp, Users, Target } from "lucide-react";
import { motion } from "framer-motion";

interface UserGPA {
  id: string;
  user_id: string;
  total_reflections: number;
  average_effort_score: number;
  average_quality_score: number;
  weighted_gpa: number;
  rank: number;
  profiles: {
    name: string;
    campus_name: string;
  };
}

export const ReflectionLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<UserGPA[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('user_gpa')
        .select(`
          *,
          profiles!user_id (name, campus_name)
        `)
        .order('rank', { ascending: true })
        .limit(20);

      if (error) throw error;
      setLeaderboard(data || []);
    } catch (error: any) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <Star className="h-5 w-5 text-blue-500" />;
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-100 text-yellow-800";
    if (rank === 2) return "bg-gray-100 text-gray-800";
    if (rank === 3) return "bg-amber-100 text-amber-800";
    if (rank <= 10) return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-600";
  };

  const getGPAColor = (gpa: number) => {
    if (gpa >= 8) return "text-green-600";
    if (gpa >= 6) return "text-blue-600";
    if (gpa >= 4) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{leaderboard.length}</div>
            <p className="text-xs text-blue-700">Active reflection participants</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Top GPA</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {leaderboard[0]?.weighted_gpa?.toFixed(2) || '0.00'}
            </div>
            <p className="text-xs text-green-700">Highest weighted GPA</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Avg Reflections</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {leaderboard.length > 0 
                ? (leaderboard.reduce((sum, user) => sum + user.total_reflections, 0) / leaderboard.length).toFixed(1)
                : '0'
              }
            </div>
            <p className="text-xs text-purple-700">Average per participant</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard Table */}
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Reflection Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-center">Rank</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead className="text-center">Reflections</TableHead>
                <TableHead className="text-center">Effort</TableHead>
                <TableHead className="text-center">Quality</TableHead>
                <TableHead className="text-center">Weighted GPA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaderboard.map((user, index) => (
                <motion.tr
                  key={user.user_id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`hover:bg-gray-50 transition-colors ${
                    user.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-transparent' : ''
                  }`}
                >
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getRankIcon(user.rank)}
                      <Badge variant="secondary" className={getRankBadgeColor(user.rank)}>
                        #{user.rank}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.profiles?.name || 'Unknown'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.profiles?.campus_name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">
                      {user.total_reflections}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-semibold ${getGPAColor(user.average_effort_score)}`}>
                      {user.average_effort_score.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-semibold ${getGPAColor(user.average_quality_score)}`}>
                      {user.average_quality_score.toFixed(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold text-lg ${getGPAColor(user.weighted_gpa)}`}>
                      {user.weighted_gpa.toFixed(2)}
                    </span>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
