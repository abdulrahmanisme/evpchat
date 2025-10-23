import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SubmissionForm } from "@/components/dashboard/SubmissionForm";
import { SubmissionsList } from "@/components/dashboard/SubmissionsList";

interface Profile {
  name: string;
  campus_name: string;
  course: string;
  batch: string;
  total_score: number;
  bonus_points: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }
      loadProfile(session.user.id);
    };
    checkAuth();
  }, [navigate]);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      
      if (!data.name || !data.campus_name) {
        navigate('/apply');
        return;
      }

      setProfile(data);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

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

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-3xl">{profile.name}</CardTitle>
                  <CardDescription className="text-lg mt-2">
                    {profile.campus_name} • {profile.course} • {profile.batch}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-bold">{profile.total_score}</div>
                  <div className="text-sm text-muted-foreground">Total Score</div>
                  {profile.bonus_points > 0 && (
                    <Badge variant="secondary" className="mt-2">
                      +{profile.bonus_points} Bonus
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Performance Tracking</CardTitle>
                  <CardDescription>Submit proof of your contributions</CardDescription>
                </div>
                <Button onClick={() => setShowSubmissionForm(!showSubmissionForm)}>
                  {showSubmissionForm ? "Cancel" : "New Submission"}
                </Button>
              </div>
            </CardHeader>
            {showSubmissionForm && (
              <CardContent>
                <SubmissionForm 
                  onSuccess={() => {
                    setShowSubmissionForm(false);
                    loadProfile(profile.name);
                  }} 
                />
              </CardContent>
            )}
          </Card>

          <SubmissionsList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;