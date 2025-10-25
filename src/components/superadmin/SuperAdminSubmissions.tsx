import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { getCategoryLabel } from "@/lib/supabase";
import { format } from "date-fns";
import { FileText, Search, Eye, CheckCircle, XCircle, Clock } from "lucide-react";

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
  verified_at: string | null;
  verified_by: string | null;
  profiles: {
    name: string;
    campus_name: string;
  };
  verifier_profile?: {
    name: string;
  };
}

export const SuperAdminSubmissions = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          profiles!user_id (name, campus_name),
          verifier_profile:profiles!verified_by (name)
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

  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('submissions')
        .update({
          status: newStatus,
          verified_at: new Date().toISOString(),
          verified_by: session.user.id,
        })
        .eq('id', submissionId);

      if (error) throw error;

      toast.success("Submission status updated!");
      loadSubmissions();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'needs_revision':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-500">Verified</Badge>;
      case 'needs_revision':
        return <Badge variant="destructive">Needs Revision</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.profiles?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.profiles?.campus_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || submission.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || submission.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  if (loading) {
    return <div className="text-center py-8">Loading submissions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Submissions Management</h2>
          <p className="text-muted-foreground">Oversee all submissions across the system</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 w-64"
            />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="needs_revision">Needs Revision</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="campus_outreach">Campus Outreach</SelectItem>
            <SelectItem value="events_attended">Events Attended</SelectItem>
            <SelectItem value="event_contribution">Event Contribution</SelectItem>
            <SelectItem value="leadership">Leadership</SelectItem>
            <SelectItem value="collaboration">Collaboration</SelectItem>
            <SelectItem value="communication">Communication</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {submissions.filter(s => s.status === 'pending').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {submissions.filter(s => s.status === 'verified').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Needs Revision</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {submissions.filter(s => s.status === 'needs_revision').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Verified By</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">
                    {submission.profiles?.name || 'Unknown'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{submission.profiles?.campus_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {getCategoryLabel(submission.category)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {submission.numeric_value !== null ? (
                      <span className="font-mono">{submission.numeric_value}</span>
                    ) : (
                      <span className="text-sm text-muted-foreground truncate max-w-32">
                        {submission.text_value}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(submission.status)}
                      {getStatusBadge(submission.status)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-bold">{submission.score}</span>
                  </TableCell>
                  <TableCell>
                    {submission.verifier_profile?.name || (
                      <span className="text-muted-foreground">Not verified</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(submission.created_at), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {submission.proof_url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                        >
                          <a
                            href={submission.proof_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      <Select
                        value={submission.status}
                        onValueChange={(value) => handleStatusChange(submission.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="needs_revision">Needs Revision</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
