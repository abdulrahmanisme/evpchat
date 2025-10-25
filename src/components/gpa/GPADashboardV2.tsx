import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { GraduationCap, TrendingUp, Target, CheckCircle, Clock } from "lucide-react";
import { GrowthEvaluation, CorePrinciple } from "@/types/evaluation";

interface Profile {
  id: string;
  name: string;
  campus_name: string;
  course: string;
  batch: string;
  growth_score: number;
  total_credits: number;
  rank: number;
}

interface GPADashboardProps {
  userId?: string;
}

export const GPADashboardV2 = ({ userId }: GPADashboardProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [evaluations, setEvaluations] = useState<(GrowthEvaluation & { core_principles: CorePrinciple })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGPAData();
  }, [userId]);

  const loadGPAData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const targetUserId = userId || session?.user?.id;
      
      if (!targetUserId) return;

      // Load profile with growth score data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, campus_name, course, batch, gpa as growth_score, total_credits, rank')
        .eq('id', targetUserId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load growth evaluations
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('growth_evaluations')
        .select(`
          *,
          core_principles!principle_id (*)
        `)
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (evaluationsError) throw evaluationsError;
      setEvaluations(evaluationsData || []);
    } catch (error: any) {
      console.error('Error loading GPA data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (verified: boolean) => {
    return verified ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <Clock className="h-4 w-4 text-yellow-500" />;
  };

  const getStatusBadge = (verified: boolean) => {
    return verified ? 
      <Badge variant="default" className="bg-green-500">Verified</Badge> : 
      <Badge variant="secondary">Pending</Badge>;
  };

  const getGrowthScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-blue-600";
    if (score >= 4) return "text-yellow-600";
    if (score >= 2) return "text-orange-600";
    return "text-red-600";
  };

  const getGrowthScoreLabel = (score: number) => {
    if (score >= 8) return "Excellent";
    if (score >= 6) return "Good";
    if (score >= 4) return "Satisfactory";
    if (score >= 2) return "Needs Improvement";
    return "Below Standards";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="text-center py-8">No growth data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Growth Score Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Score</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGrowthScoreColor(profile.growth_score || 0)}`}>
              {(profile.growth_score || 0).toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getGrowthScoreLabel(profile.growth_score || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rank</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{profile.rank || 'N/A'}</div>
            <p className="text-xs text-muted-foreground">
              {profile.rank === 1 ? "Top Performer" : 
               profile.rank && profile.rank <= 3 ? "Top 3" : 
               profile.rank && profile.rank <= 10 ? "Top 10" : "Campus Lead"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.total_credits || 0}</div>
            <p className="text-xs text-muted-foreground">
              Credits earned
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Growth Evaluations */}
      <Card>
        <CardHeader>
          <CardTitle>Growth Evaluations</CardTitle>
          <CardDescription>
            Your submitted reflections and their verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {evaluations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No growth evaluations submitted yet
            </div>
          ) : (
            <div className="space-y-4">
              {evaluations.map((evaluation) => (
                <div key={evaluation.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{evaluation.core_principles.name}</h4>
                      <Badge variant="outline">
                        {evaluation.credit_value} credits
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(evaluation.admin_verified || false)}
                      {getStatusBadge(evaluation.admin_verified || false)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Growth Grade:</span>
                      <span className="ml-2 font-medium">{evaluation.growth_grade}/10</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">GPA Contribution:</span>
                      <span className="ml-2 font-medium">{evaluation.gpa_contribution.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-1">Reflection:</p>
                    <p className="text-sm bg-muted p-2 rounded">
                      {evaluation.ai_summary}
                    </p>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Week: {format(new Date(evaluation.week), 'MMM dd, yyyy')} • 
                    Submitted: {format(new Date(evaluation.created_at), 'MMM dd, yyyy HH:mm')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
