import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { GraduationCap, TrendingUp, Target, Clock, CheckCircle, XCircle } from "lucide-react";

interface Profile {
  id: string;
  name: string;
  campus_name: string;
  course: string;
  batch: string;
  gpa: number;
  rank: number;
  total_credits: number;
  attendance_count: number;
}

interface GrowthEvaluation {
  id: string;
  principle_id: string;
  reflection_text: string;
  effort_score: number;
  credits_earned: number;
  status: string;
  admin_comments: string | null;
  created_at: string;
  core_principles: {
    name: string;
    description: string;
    max_credits: number;
  };
}

interface GPADashboardProps {
  userId?: string;
}

export const GPADashboard = ({ userId }: GPADashboardProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [evaluations, setEvaluations] = useState<GrowthEvaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGPAData();
  }, [userId]);

  const loadGPAData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const targetUserId = userId || session?.user?.id;
      
      if (!targetUserId) return;

      // Load profile with GPA data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, name, campus_name, course, batch, gpa, rank, total_credits, attendance_count')
        .eq('id', targetUserId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Load growth evaluations
      const { data: evaluationsData, error: evaluationsError } = await supabase
        .from('growth_evaluations')
        .select(`
          id,
          principle_id,
          reflection_text,
          effort_score,
          credits_earned,
          status,
          admin_comments,
          created_at,
          core_principles!principle_id (
            name,
            description,
            max_credits
          )
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return "text-green-600";
    if (gpa >= 3.0) return "text-blue-600";
    if (gpa >= 2.5) return "text-yellow-600";
    if (gpa >= 2.0) return "text-orange-600";
    return "text-red-600";
  };

  const getGPALabel = (gpa: number) => {
    if (gpa >= 3.5) return "Excellent";
    if (gpa >= 3.0) return "Good";
    if (gpa >= 2.5) return "Satisfactory";
    if (gpa >= 2.0) return "Needs Improvement";
    return "Below Standards";
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
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
    return <div className="text-center py-8">No GPA data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* GPA Overview Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">GPA</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getGPAColor(profile.gpa)}`}>
              {profile.gpa.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {getGPALabel(profile.gpa)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rank</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{profile.rank}</div>
            <p className="text-xs text-muted-foreground">
              {profile.rank === 1 ? "Top Performer" : 
               profile.rank <= 3 ? "Top 3" : 
               profile.rank <= 10 ? "Top 10" : "Campus Lead"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.total_credits.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Credits earned
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile.attendance_count}</div>
            <p className="text-xs text-muted-foreground">
              Events attended
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
                        {evaluation.core_principles.max_credits} max credits
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(evaluation.status)}
                      {getStatusBadge(evaluation.status)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Effort Score:</span>
                      <span className="ml-2 font-medium">{evaluation.effort_score}/5</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Credits Earned:</span>
                      <span className="ml-2 font-medium">{evaluation.credits_earned.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-muted-foreground mb-1">Reflection:</p>
                    <p className="text-sm bg-muted p-2 rounded">
                      {evaluation.reflection_text}
                    </p>
                  </div>

                  {evaluation.admin_comments && (
                    <div className="mb-3">
                      <p className="text-sm text-muted-foreground mb-1">Admin Comments:</p>
                      <p className="text-sm bg-blue-50 p-2 rounded border-l-2 border-blue-200">
                        {evaluation.admin_comments}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground">
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
