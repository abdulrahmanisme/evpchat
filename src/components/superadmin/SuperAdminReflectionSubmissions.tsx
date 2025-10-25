import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  Eye, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  Target, 
  Star, 
  ChevronDown, 
  ChevronRight,
  Brain,
  TrendingUp,
  Award,
  MessageSquare,
  Lightbulb,
  CheckCircle,
  AlertCircle,
  Crown,
  Shield
} from "lucide-react";
import { format } from "date-fns";

interface ReflectionSubmission {
  id: string;
  user_id: string;
  principle: string;
  question: string;
  response: string;
  effort_score: number | null;
  quality_score: number | null;
  admin_effort_score: number | null;
  admin_quality_score: number | null;
  admin_feedback: string | null;
  manually_reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  credit_value: number;
  created_at: string;
  profiles: {
    name: string;
    campus_name: string;
    app_role?: string;
  };
}

interface AIEvaluationDetails {
  effort_score: number;
  quality_score: number;
  feedback: string;
  suggestions: string[];
  reasoning: {
    effort_reasoning: string;
    quality_reasoning: string;
    overall_assessment: string;
  };
}

export const SuperAdminReflectionSubmissions = () => {
  const [submissions, setSubmissions] = useState<ReflectionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [principleFilter, setPrincipleFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [expandedPrinciples, setExpandedPrinciples] = useState<Set<string>>(new Set());
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
  const [aiDetails, setAiDetails] = useState<Record<string, AIEvaluationDetails>>({});
  const [editingSubmission, setEditingSubmission] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    effort_score: "",
    quality_score: "",
    feedback: ""
  });

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      console.log('Loading reflection submissions...');
      
      // First, fetch reflections
      const { data: reflections, error: reflectionsError } = await supabase
        .from('reflections')
        .select('*')
        .order('created_at', { ascending: false });

      if (reflectionsError) {
        console.error('Error fetching reflections:', reflectionsError);
        throw reflectionsError;
      }

      console.log('Fetched reflections:', reflections);

      // Then fetch profiles for those users
      const userIds = [...new Set(reflections?.map(r => r.user_id) || [])];
      
      let submissionsWithProfiles = [];
      if (userIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, campus_name')
          .in('id', userIds);

        if (profilesError) {
          console.error('Error fetching profiles:', profilesError);
          throw profilesError;
        }

        console.log('Fetched profiles:', profiles);

        // Get user roles separately
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        // Create a map of user_id to role
        const roleMap = new Map(rolesData?.map(role => [role.user_id, role.role]) || []);

        // Combine data
        submissionsWithProfiles = reflections?.map(reflection => ({
          ...reflection,
          profiles: {
            ...profiles?.find(p => p.id === reflection.user_id),
            app_role: roleMap.get(reflection.user_id) || 'campus_lead'
          }
        })) || [];
      } else {
        submissionsWithProfiles = reflections || [];
      }

      console.log('Combined submissions:', submissionsWithProfiles);
      setSubmissions(submissionsWithProfiles);
    } catch (error: any) {
      console.error('Error loading submissions:', error);
      toast.error(`Failed to load reflection submissions: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpanded = (submissionId: string) => {
    const newExpanded = new Set(expandedSubmissions);
    if (newExpanded.has(submissionId)) {
      newExpanded.delete(submissionId);
    } else {
      newExpanded.add(submissionId);
    }
    setExpandedSubmissions(newExpanded);
  };

  const getDetailedAIEvaluation = async (submission: ReflectionSubmission) => {
    if (aiDetails[submission.id]) return;

    setLoadingDetails(prev => new Set(prev).add(submission.id));

    try {
      // Call the Edge Function to get detailed AI evaluation
      const { data, error } = await supabase.functions.invoke('evaluate-reflection', {
        body: {
          reflection_id: submission.id,
          principle: submission.principle,
          question: submission.question,
          response: submission.response,
          user_id: submission.user_id,
          detailed: true // Request detailed reasoning
        }
      });

      if (error) throw error;

      // Store the detailed evaluation
      setAiDetails(prev => ({
        ...prev,
        [submission.id]: data.evaluation
      }));
    } catch (error) {
      console.error('Error getting AI details:', error);
      // Fallback to basic evaluation with more specific error message
      setAiDetails(prev => ({
        ...prev,
        [submission.id]: {
          effort_score: submission.effort_score || 0,
          quality_score: submission.quality_score || 0,
          feedback: `AI evaluation failed: ${error.message || 'Unknown error'}. Your reflection has been recorded.`,
          suggestions: ["Try to be more specific", "Include more details"],
          reasoning: {
            effort_reasoning: `Based on response length and detail level. Error: ${error.message || 'Unknown error'}`,
            quality_reasoning: `Based on writing clarity and insightfulness. Error: ${error.message || 'Unknown error'}`,
            overall_assessment: `Standard evaluation applied due to error: ${error.message || 'Unknown error'}`
          }
        }
      }));
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(submission.id);
        return newSet;
      });
    }
  };

  const startEdit = (submission: ReflectionSubmission) => {
    setEditingSubmission(submission.id);
    setEditForm({
      effort_score: submission.admin_effort_score?.toString() || submission.effort_score?.toString() || "",
      quality_score: submission.admin_quality_score?.toString() || submission.quality_score?.toString() || "",
      feedback: submission.admin_feedback || ""
    });
  };

  const cancelEdit = () => {
    setEditingSubmission(null);
    setEditForm({ effort_score: "", quality_score: "", feedback: "" });
  };

  const saveEdit = async () => {
    if (!editingSubmission) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("You must be logged in to update scores.");
        return;
      }

      const updateData: any = {
        manually_reviewed: true,
        reviewed_by: session.user.id,
        reviewed_at: new Date().toISOString()
      };

      // Update scores if provided
      if (editForm.effort_score) {
        const effortScore = parseFloat(editForm.effort_score);
        if (effortScore >= 0 && effortScore <= 10) {
          updateData.admin_effort_score = effortScore;
        }
      }

      if (editForm.quality_score) {
        const qualityScore = parseFloat(editForm.quality_score);
        if (qualityScore >= 0 && qualityScore <= 10) {
          updateData.admin_quality_score = qualityScore;
        }
      }

      // Update feedback
      if (editForm.feedback) {
        updateData.admin_feedback = editForm.feedback;
      }

      const { error } = await supabase
        .from('reflections')
        .update(updateData)
        .eq('id', editingSubmission);

      if (error) throw error;

      toast.success("Scores updated successfully!");
      cancelEdit();
      loadSubmissions();
    } catch (error: any) {
      console.error('Error updating scores:', error);
      toast.error(`Failed to update scores: ${error.message}`);
    }
  };
  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.profiles?.campus_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.response.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrinciple = principleFilter === "all" || submission.principle === principleFilter;
    
    const matchesScore = scoreFilter === "all" || 
                        (scoreFilter === "evaluated" && submission.effort_score !== null && submission.quality_score !== null) ||
                        (scoreFilter === "pending" && (submission.effort_score === null || submission.quality_score === null));

    const matchesRole = roleFilter === "all" || (submission.profiles?.app_role || 'campus_lead') === roleFilter;

    return matchesSearch && matchesPrinciple && matchesScore && matchesRole;
  });

  // Group submissions by user and then by principle
  const groupedByUser = filteredSubmissions.reduce((acc, submission) => {
    const userId = submission.user_id;
    const userName = submission.profiles?.name || 'Unknown';
    const campusName = submission.profiles?.campus_name || 'Unknown';
    const userRole = submission.profiles?.app_role || 'campus_lead';
    
    if (!acc[userId]) {
      acc[userId] = {
        name: userName,
        campus_name: campusName,
        user_id: userId,
        role: userRole,
        principles: {}
      };
    }
    
    const principle = submission.principle;
    if (!acc[userId].principles[principle]) {
      acc[userId].principles[principle] = [];
    }
    
    acc[userId].principles[principle].push(submission);
    
    return acc;
  }, {} as Record<string, { name: string; campus_name: string; user_id: string; role: string; principles: Record<string, ReflectionSubmission[]> }>);

  const toggleUserExpanded = (userId: string) => {
    const newExpanded = new Set(expandedUsers);
    if (newExpanded.has(userId)) {
      newExpanded.delete(userId);
    } else {
      newExpanded.add(userId);
    }
    setExpandedUsers(newExpanded);
  };

  const togglePrincipleExpanded = (userId: string, principle: string) => {
    const key = `${userId}-${principle}`;
    const newExpanded = new Set(expandedPrinciples);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
      // Load detailed AI evaluation for all submissions in this principle
      if (groupedByUser[userId]?.principles[principle]) {
        groupedByUser[userId].principles[principle].forEach(submission => {
          if (!expandedSubmissions.has(submission.id)) {
            getDetailedAIEvaluation(submission);
          }
        });
      }
    }
    setExpandedPrinciples(newExpanded);
  };

  const toggleSubmissionExpanded = (submissionId: string) => {
    const newExpanded = new Set(expandedSubmissions);
    if (newExpanded.has(submissionId)) {
      newExpanded.delete(submissionId);
    } else {
      newExpanded.add(submissionId);
      const submission = submissions.find(s => s.id === submissionId);
      if (submission && !aiDetails[submissionId]) {
        getDetailedAIEvaluation(submission);
      }
    }
    setExpandedSubmissions(newExpanded);
  };
  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-gray-500";
    if (score >= 8) return "text-green-600";
    if (score >= 6) return "text-blue-600";
    if (score >= 4) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number | null) => {
    if (score === null) return "bg-gray-100 text-gray-600";
    if (score >= 8) return "bg-green-100 text-green-800";
    if (score >= 6) return "bg-blue-100 text-blue-800";
    if (score >= 4) return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getPrincipleColor = (principle: string) => {
    const colors = {
      'Ownership': 'bg-blue-100 text-blue-800',
      'Learning by Doing': 'bg-green-100 text-green-800',
      'Collaboration': 'bg-purple-100 text-purple-800',
      'Innovation': 'bg-orange-100 text-orange-800',
      'Impact': 'bg-pink-100 text-pink-800'
    };
    return colors[principle as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleColor = (role: string) => {
    const colors = {
      'campus_lead': 'bg-blue-100 text-blue-800',
      'admin': 'bg-purple-100 text-purple-800',
      'superadmin': 'bg-yellow-100 text-yellow-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleIcon = (role: string) => {
    const icons = {
      'campus_lead': User,
      'admin': Shield,
      'superadmin': Crown
    };
    return icons[role as keyof typeof icons] || User;
  };

  const getPrincipleIcon = (principle: string) => {
    const icons = {
      'Ownership': Target,
      'Learning by Doing': Lightbulb,
      'Collaboration': User,
      'Innovation': Star,
      'Impact': TrendingUp
    };
    return icons[principle as keyof typeof icons] || Target;
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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Submissions</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{submissions.length}</div>
            <p className="text-xs text-blue-700">All reflection submissions</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Evaluated</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">
              {submissions.filter(s => s.effort_score !== null && s.quality_score !== null).length}
            </div>
            <p className="text-xs text-green-700">AI evaluated submissions</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Pending</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">
              {submissions.filter(s => s.effort_score === null || s.quality_score === null).length}
            </div>
            <p className="text-xs text-yellow-700">Awaiting AI evaluation</p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Campus Leads</CardTitle>
            <User className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {submissions.filter(s => (s.profiles?.app_role || 'campus_lead') === 'campus_lead').length}
            </div>
            <p className="text-xs text-purple-700">Campus lead submissions</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Avg Effort</CardTitle>
            <Star className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">
              {submissions.filter(s => s.effort_score !== null).length > 0 
                ? (submissions.reduce((sum, s) => sum + (s.effort_score || 0), 0) / submissions.filter(s => s.effort_score !== null).length).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-xs text-orange-700">Average effort score</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Submissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, campus, or response..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Principle</label>
              <Select value={principleFilter} onValueChange={setPrincipleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All principles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Principles</SelectItem>
                  <SelectItem value="Ownership">Ownership</SelectItem>
                  <SelectItem value="Learning by Doing">Learning by Doing</SelectItem>
                  <SelectItem value="Collaboration">Collaboration</SelectItem>
                  <SelectItem value="Innovation">Innovation</SelectItem>
                  <SelectItem value="Impact">Impact</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="campus_lead">Campus Leads</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                  <SelectItem value="superadmin">Super Admins</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={scoreFilter} onValueChange={setScoreFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="evaluated">Evaluated</SelectItem>
                  <SelectItem value="pending">Pending Evaluation</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Submissions - Grouped by User */}
      <div className="space-y-4">
        {Object.entries(groupedByUser).map(([userId, userData]) => {
          const isUserExpanded = expandedUsers.has(userId);
          const earliestSubmission = userData.principles[Object.keys(userData.principles)[0]]?.[0];
          const RoleIconComponent = getRoleIcon(userData.role);
          
          return (
            <Card key={userId} className="overflow-hidden">
              {/* User Header */}
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleUserExpanded(userId)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {isUserExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <RoleIconComponent className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{userData.name}</CardTitle>
                        <Badge className={getRoleColor(userData.role)}>
                          <RoleIconComponent className="h-3 w-3 mr-1" />
                          {userData.role}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {userData.campus_name} • {earliestSubmission ? format(new Date(earliestSubmission.created_at), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {Object.keys(userData.principles).length} Principles
                    </Badge>
                    <Badge variant="outline">
                      {Object.values(userData.principles).flat().length} Submissions
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              {/* Principles for this user */}
              {isUserExpanded && (
                <CardContent className="pt-0 border-t bg-gray-50/50">
                  <div className="space-y-3 mt-4">
                    {Object.entries(userData.principles).map(([principle, principleSubmissions]) => {
                      const principleKey = `${userId}-${principle}`;
                      const isPrincipleExpanded = expandedPrinciples.has(principleKey);
                      const IconComponent = getPrincipleIcon(principle);
                      const avgEffort = principleSubmissions.reduce((sum, s) => sum + (s.admin_effort_score || s.effort_score || 0), 0) / principleSubmissions.length;
                      const avgQuality = principleSubmissions.reduce((sum, s) => sum + (s.admin_quality_score || s.quality_score || 0), 0) / principleSubmissions.length;

                      return (
                        <Card key={principleKey} className="border-l-4 border-l-blue-500">
                          <CardHeader 
                            className="cursor-pointer hover:bg-white transition-colors py-3"
                            onClick={() => togglePrincipleExpanded(userId, principle)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isPrincipleExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-gray-500" />
                                )}
                                <IconComponent className="h-4 w-4 text-gray-600" />
                                <CardTitle className="text-base">{principle}</CardTitle>
                                <Badge variant="outline" className="text-xs">
                                  {principleSubmissions.length} questions
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={getScoreBadgeColor(avgEffort)}>
                                  Avg Effort: {avgEffort.toFixed(1)}
                                </Badge>
                                <Badge className={getScoreBadgeColor(avgQuality)}>
                                  Avg Quality: {avgQuality.toFixed(1)}
                                </Badge>
                              </div>
                            </div>
                          </CardHeader>

                          {/* Questions under this principle */}
                          {isPrincipleExpanded && (
                            <CardContent className="pt-0 bg-white">
                              <div className="space-y-3">
                                {principleSubmissions.map((submission) => {
                                  const isSubmissionExpanded = expandedSubmissions.has(submission.id);
                                  const details = aiDetails[submission.id];

                                  return (
                                    <Card key={submission.id} className="border border-gray-200">
                                      <CardHeader 
                                        className="cursor-pointer hover:bg-gray-50 transition-colors py-3"
                                        onClick={() => toggleSubmissionExpanded(submission.id)}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-3">
                                            {isSubmissionExpanded ? (
                                              <ChevronDown className="h-3 w-3 text-gray-500" />
                                            ) : (
                                              <ChevronRight className="h-3 w-3 text-gray-500" />
                                            )}
                                            <p className="font-medium text-sm text-gray-800">
                                              {submission.question}
                                            </p>
                                          </div>
                                                                                     <div className="flex gap-2">
                                             <Badge className={getScoreBadgeColor(submission.admin_effort_score || submission.effort_score)}>
                                               Effort: {submission.admin_effort_score !== null ? submission.admin_effort_score.toFixed(1) : (submission.effort_score !== null ? submission.effort_score.toFixed(1) : 'Pending')}
                                               {submission.admin_effort_score !== null && <span className="ml-1 text-xs">(A)</span>}
                                             </Badge>
                                             <Badge className={getScoreBadgeColor(submission.admin_quality_score || submission.quality_score)}>
                                               Quality: {submission.admin_quality_score !== null ? submission.admin_quality_score.toFixed(1) : (submission.quality_score !== null ? submission.quality_score.toFixed(1) : 'Pending')}
                                               {submission.admin_quality_score !== null && <span className="ml-1 text-xs">(A)</span>}
                                             </Badge>
                                           </div>
                                        </div>
                                      </CardHeader>

                                      {isSubmissionExpanded && (
                                        <CardContent className="pt-0 border-t bg-gray-50">
                                          <Tabs defaultValue="response" className="w-full">
                                            <TabsList className="grid w-full grid-cols-4">
                                              <TabsTrigger value="response">Response Details</TabsTrigger>
                                              <TabsTrigger value="evaluation">AI Evaluation</TabsTrigger>
                                              <TabsTrigger value="reasoning">Detailed Reasoning</TabsTrigger>
                                              <TabsTrigger value="admin">Admin Review</TabsTrigger>
                                            </TabsList>

                                            <TabsContent value="response" className="space-y-3 mt-3">
                                              <div className="space-y-2">
                                                <h4 className="font-semibold text-xs text-gray-600">Question:</h4>
                                                <p className="text-sm text-gray-800 bg-gray-50 p-2 rounded">
                                                  {submission.question}
                                                </p>
                                              </div>
                                              <div className="space-y-2">
                                                <h4 className="font-semibold text-xs text-gray-600">Student Response:</h4>
                                                <p className="text-sm text-gray-800 bg-blue-50 p-2 rounded whitespace-pre-wrap">
                                                  {submission.response}
                                                </p>
                                              </div>
                                            </TabsContent>

                                            <TabsContent value="evaluation" className="space-y-3 mt-3">
                                              <div className="grid grid-cols-2 gap-2">
                                                <Card className="border-green-200 bg-green-50/50">
                                                  <CardHeader className="pb-2">
                                                    <CardTitle className="text-xs font-medium text-green-800">
                                                      Effort Score
                                                    </CardTitle>
                                                  </CardHeader>
                                                  <CardContent>
                                                    <div className="text-2xl font-bold text-green-900">
                                                      {submission.admin_effort_score !== null ? submission.admin_effort_score.toFixed(1) : (submission.effort_score !== null ? submission.effort_score.toFixed(1) : 'Pending')}
                                                    </div>
                                                    {submission.admin_effort_score !== null && (
                                                      <p className="text-xs text-green-700 mt-1">Manual Override</p>
                                                    )}
                                                  </CardContent>
                                                </Card>

                                                <Card className="border-blue-200 bg-blue-50/50">
                                                  <CardHeader className="pb-2">
                                                    <CardTitle className="text-xs font-medium text-blue-800">
                                                      Quality Score
                                                    </CardTitle>
                                                  </CardHeader>
                                                  <CardContent>
                                                    <div className="text-2xl font-bold text-blue-900">
                                                      {submission.admin_quality_score !== null ? submission.admin_quality_score.toFixed(1) : (submission.quality_score !== null ? submission.quality_score.toFixed(1) : 'Pending')}
                                                    </div>
                                                    {submission.admin_quality_score !== null && (
                                                      <p className="text-xs text-blue-700 mt-1">Manual Override</p>
                                                    )}
                                                  </CardContent>
                                                </Card>
                                              </div>

                                              {details && (
                                                <div className="space-y-2">
                                                  <h4 className="font-semibold text-xs text-gray-600">AI Feedback:</h4>
                                                  <p className="text-sm text-gray-800 bg-yellow-50 p-2 rounded">
                                                    {details.feedback}
                                                  </p>
                                                </div>
                                              )}
                                            </TabsContent>

                                            <TabsContent value="reasoning" className="space-y-2 mt-3">
                                              {details ? (
                                                <div className="space-y-2">
                                                  <Card className="border-orange-200 bg-orange-50/50">
                                                    <CardHeader className="pb-2">
                                                      <CardTitle className="text-xs font-medium text-orange-800">
                                                        Effort Reasoning
                                                      </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                      <p className="text-xs text-gray-800">
                                                        {details.reasoning?.effort_reasoning || "Not available"}
                                                      </p>
                                                    </CardContent>
                                                  </Card>

                                                  <Card className="border-purple-200 bg-purple-50/50">
                                                    <CardHeader className="pb-2">
                                                      <CardTitle className="text-xs font-medium text-purple-800">
                                                        Quality Reasoning
                                                      </CardTitle>
                                                    </CardHeader>
                                                    <CardContent>
                                                      <p className="text-xs text-gray-800">
                                                        {details.reasoning?.quality_reasoning || "Not available"}
                                                      </p>
                                                    </CardContent>
                                                  </Card>
                                                </div>
                                              ) : loadingDetails.has(submission.id) ? (
                                                <div className="text-center py-4">
                                                  <p className="text-xs text-gray-500">Loading AI reasoning...</p>
                                                </div>
                                              ) : (
                                                <p className="text-xs text-gray-500">Click to load detailed AI reasoning...</p>
                                              )}
                                            </TabsContent>

                                            <TabsContent value="admin" className="space-y-3 mt-3">
                                              {editingSubmission === submission.id ? (
                                                <div className="space-y-3">
                                                  <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                      <label className="text-xs font-medium text-gray-700">Effort Score (0-10)</label>
                                                      <Input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        step="0.1"
                                                        value={editForm.effort_score}
                                                        onChange={(e) => setEditForm({...editForm, effort_score: e.target.value})}
                                                        placeholder={submission.effort_score?.toString() || "0"}
                                                        className="mt-1"
                                                      />
                                                    </div>
                                                    <div>
                                                      <label className="text-xs font-medium text-gray-700">Quality Score (0-10)</label>
                                                      <Input
                                                        type="number"
                                                        min="0"
                                                        max="10"
                                                        step="0.1"
                                                        value={editForm.quality_score}
                                                        onChange={(e) => setEditForm({...editForm, quality_score: e.target.value})}
                                                        placeholder={submission.quality_score?.toString() || "0"}
                                                        className="mt-1"
                                                      />
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <label className="text-xs font-medium text-gray-700">Admin Feedback</label>
                                                    <Textarea
                                                      value={editForm.feedback}
                                                      onChange={(e) => setEditForm({...editForm, feedback: e.target.value})}
                                                      placeholder="Add your feedback for this submission..."
                                                      className="mt-1 min-h-[100px]"
                                                    />
                                                  </div>
                                                  <div className="flex gap-2">
                                                    <Button onClick={saveEdit} className="flex-1">
                                                      Save Scores
                                                    </Button>
                                                    <Button variant="outline" onClick={cancelEdit} className="flex-1">
                                                      Cancel
                                                    </Button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="space-y-3">
                                                  <div className="flex items-center justify-between">
                                                    <h4 className="font-semibold text-xs text-gray-600">Manual Review</h4>
                                                    {submission.manually_reviewed && (
                                                      <Badge variant="outline" className="bg-green-50 text-green-700">
                                                        Reviewed
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  {submission.admin_feedback && (
                                                    <div className="bg-blue-50 p-3 rounded">
                                                      <p className="text-xs font-medium text-blue-900 mb-1">Previous Feedback:</p>
                                                      <p className="text-sm text-blue-800">{submission.admin_feedback}</p>
                                                    </div>
                                                  )}
                                                  {(submission.admin_effort_score !== null || submission.admin_quality_score !== null) && (
                                                    <div className="grid grid-cols-2 gap-2">
                                                      {submission.admin_effort_score !== null && (
                                                        <Card className="border-green-300 bg-green-50">
                                                          <CardContent className="pt-3">
                                                            <p className="text-xs font-medium text-green-800">Manual Effort Score</p>
                                                            <p className="text-2xl font-bold text-green-900">{submission.admin_effort_score.toFixed(1)}</p>
                                                          </CardContent>
                                                        </Card>
                                                      )}
                                                      {submission.admin_quality_score !== null && (
                                                        <Card className="border-blue-300 bg-blue-50">
                                                          <CardContent className="pt-3">
                                                            <p className="text-xs font-medium text-blue-800">Manual Quality Score</p>
                                                            <p className="text-2xl font-bold text-blue-900">{submission.admin_quality_score.toFixed(1)}</p>
                                                          </CardContent>
                                                        </Card>
                                                      )}
                                                    </div>
                                                  )}
                                                  <Button onClick={() => startEdit(submission)} className="w-full">
                                                    {submission.manually_reviewed ? "Update Review" : "Review This Submission"}
                                                  </Button>
                                                </div>
                                              )}
                                            </TabsContent>
                                          </Tabs>
                                        </CardContent>
                                      )}
                                    </Card>
                                  );
                                })}
                              </div>
                            </CardContent>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                          </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
