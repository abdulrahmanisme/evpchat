import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getCategoryLabel } from "@/lib/supabase";
import { format } from "date-fns";

interface Submission {
  id: string;
  user_id: string;
  category: string;
  numeric_value: number | null;
  text_value: string | null;
  proof_url: string | null;
  status: string;
  score: number;
  admin_comments: string | null;
  created_at: string;
  profiles: {
    name: string;
    campus_name: string;
  };
}

export const AdminSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editScore, setEditScore] = useState<number>(0);
  const [editComments, setEditComments] = useState<string>("");

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles!user_id (name, campus_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (submissionId: string, newStatus: 'verified' | 'needs_revision') => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('submissions')
        .update({
          status: newStatus,
          score: editScore,
          admin_comments: editComments,
          verified_at: new Date().toISOString(),
          verified_by: session.user.id,
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success("Submission updated!");
      setEditingId(null);
      loadSubmissions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const startEdit = (submission: Submission) => {
    setEditingId(submission.id);
    setEditScore(submission.score);
    setEditComments(submission.admin_comments || "");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <Card key={submission.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{submission.profiles?.name || 'Unknown'}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {submission.profiles?.campus_name} • {getCategoryLabel(submission.category)}
                </p>
              </div>
              <Badge variant={submission.status === 'verified' ? 'default' : 'secondary'}>
                {submission.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {submission.numeric_value !== null && (
              <div>
                <strong>Value:</strong> {submission.numeric_value}
              </div>
            )}
            
            {submission.text_value && (
              <div>
                <strong>Description:</strong>
                <p className="text-sm text-muted-foreground mt-1">{submission.text_value}</p>
              </div>
            )}
            
            {submission.proof_url && (
              <div>
                <a
                  href={submission.proof_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  View Proof →
                </a>
              </div>
            )}

            <div className="text-sm text-muted-foreground">
              Submitted: {format(new Date(submission.created_at), 'PPp')}
            </div>

            {editingId === submission.id ? (
              <div className="space-y-3 pt-4 border-t">
                <div>
                  <label className="text-sm font-medium">Score</label>
                  <Input
                    type="number"
                    value={editScore}
                    onChange={(e) => setEditScore(parseInt(e.target.value))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Admin Comments</label>
                  <Textarea
                    value={editComments}
                    onChange={(e) => setEditComments(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => handleVerify(submission.id, 'verified')}>
                    Verify
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleVerify(submission.id, 'needs_revision')}
                  >
                    Needs Revision
                  </Button>
                  <Button variant="outline" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="pt-4 border-t">
                <Button onClick={() => startEdit(submission)}>
                  Review
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};