import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCategoryLabel } from "@/lib/supabase";
import { format } from "date-fns";

interface Submission {
  id: string;
  category: string;
  numeric_value: number | null;
  text_value: string | null;
  proof_url: string | null;
  status: string;
  score: number;
  admin_comments: string | null;
  created_at: string;
}

export const SubmissionsList = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'default';
      case 'pending': return 'secondary';
      case 'needs_revision': return 'destructive';
      default: return 'secondary';
    }
  };

  if (loading) return <div>Loading submissions...</div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              No submissions yet. Create your first submission to get started!
            </p>
          ) : (
            submissions.map((submission) => (
              <div
                key={submission.id}
                className="border border-border rounded-lg p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="font-medium">{getCategoryLabel(submission.category)}</div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                    <span className="text-sm font-semibold">
                      {submission.score} pts
                    </span>
                  </div>
                </div>
                
                {submission.numeric_value !== null && (
                  <div className="text-sm">Value: {submission.numeric_value}</div>
                )}
                
                {submission.text_value && (
                  <p className="text-sm text-muted-foreground">{submission.text_value}</p>
                )}
                
                {submission.proof_url && (
                  <a
                    href={submission.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    View Proof
                  </a>
                )}
                
                {submission.admin_comments && (
                  <div className="mt-2 p-2 bg-muted rounded text-sm">
                    <strong>Admin:</strong> {submission.admin_comments}
                  </div>
                )}
                
                <div className="text-xs text-muted-foreground">
                  {format(new Date(submission.created_at), 'PPp')}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};