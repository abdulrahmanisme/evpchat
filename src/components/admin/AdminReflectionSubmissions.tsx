import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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
  AlertCircle
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
  credit_value: number;
  created_at: string;
  profiles: {
    name: string;
    campus_name: string;
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

export const AdminReflectionSubmissions = () => {
  const [submissions, setSubmissions] = useState<ReflectionSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [principleFilter, setPrincipleFilter] = useState("all");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [expandedSubmissions, setExpandedSubmissions] = useState<Set<string>>(new Set());
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
  const [aiDetails, setAiDetails] = useState<Record<string, AIEvaluationDetails>>({});

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      const { data, error } = await supabase
        .from('reflections')
        .select(`
          *,
          profiles!user_id (name, campus_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error('Error loading submissions:', error);
      toast.error('Failed to load reflection submissions');
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

  const filteredSubmissions = submissions.filter(submission => {
    const matchesSearch = submission.profiles?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.profiles?.campus_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         submission.response.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPrinciple = principleFilter === "all" || submission.principle === principleFilter;
    
    const matchesScore = scoreFilter === "all" || 
                        (scoreFilter === "evaluated" && submission.effort_score !== null && submission.quality_score !== null) ||
                        (scoreFilter === "pending" && (submission.effort_score === null || submission.quality_score === null));

    return matchesSearch && matchesPrinciple && matchesScore;
  });

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
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <CardTitle className="text-sm font-medium text-purple-800">Avg Effort</CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">
              {submissions.filter(s => s.effort_score !== null).length > 0 
                ? (submissions.reduce((sum, s) => sum + (s.effort_score || 0), 0) / submissions.filter(s => s.effort_score !== null).length).toFixed(1)
                : '0.0'
              }
            </div>
            <p className="text-xs text-purple-700">Average effort score</p>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

      {/* Detailed Submissions */}
      <div className="space-y-4">
        {filteredSubmissions.map((submission) => {
          const isExpanded = expandedSubmissions.has(submission.id);
          const IconComponent = getPrincipleIcon(submission.principle);
          const details = aiDetails[submission.id];

          return (
            <Card key={submission.id} className="overflow-hidden">
              <CardHeader 
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  toggleExpanded(submission.id);
                  if (!isExpanded) {
                    getDetailedAIEvaluation(submission);
                  }
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <IconComponent className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{submission.profiles?.name || 'Unknown'}</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {submission.profiles?.campus_name || 'N/A'} • {format(new Date(submission.created_at), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className={getPrincipleColor(submission.principle)}>
                      {submission.principle}
                    </Badge>
                    <div className="flex gap-2">
                      <Badge className={getScoreBadgeColor(submission.effort_score)}>
                        Effort: {submission.effort_score !== null ? submission.effort_score.toFixed(1) : 'Pending'}
                      </Badge>
                      <Badge className={getScoreBadgeColor(submission.quality_score)}>
                        Quality: {submission.quality_score !== null ? submission.quality_score.toFixed(1) : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0">
                  <Tabs defaultValue="response" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="response">Response Details</TabsTrigger>
                      <TabsTrigger value="evaluation">AI Evaluation</TabsTrigger>
                      <TabsTrigger value="reasoning">Detailed Reasoning</TabsTrigger>
                    </TabsList>

                    <TabsContent value="response" className="space-y-4">
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600 mb-2">Question:</h4>
                          <p className="text-gray-800 bg-gray-50 p-3 rounded-lg">
                            {submission.question}
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm text-gray-600 mb-2">Student Response:</h4>
                          <p className="text-gray-800 bg-blue-50 p-3 rounded-lg whitespace-pre-wrap">
                            {submission.response}
                          </p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="evaluation" className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-green-200 bg-green-50/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-green-800 flex items-center gap-2">
                              <Star className="h-4 w-4" />
                              Effort Score
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-green-900 mb-2">
                              {submission.effort_score !== null ? submission.effort_score.toFixed(1) : 'Pending'}
                            </div>
                            <p className="text-xs text-green-700">
                              Measures initiative, dedication, and proactivity
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="border-blue-200 bg-blue-50/50">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-blue-800 flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              Quality Score
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="text-3xl font-bold text-blue-900 mb-2">
                              {submission.quality_score !== null ? submission.quality_score.toFixed(1) : 'Pending'}
                            </div>
                            <p className="text-xs text-blue-700">
                              Measures thoughtfulness, clarity, and insightfulness
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {details && (
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-semibold text-sm text-gray-600 mb-2 flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              AI Feedback:
                            </h4>
                            <p className="text-gray-800 bg-yellow-50 p-3 rounded-lg">
                              {details.feedback}
                            </p>
                          </div>
                          <div>
                            <h4 className="font-semibold text-sm text-gray-600 mb-2 flex items-center gap-2">
                              <Lightbulb className="h-4 w-4" />
                              Suggestions for Improvement:
                            </h4>
                            <ul className="space-y-1">
                              {details.suggestions.map((suggestion, index) => (
                                <li key={index} className="text-gray-800 bg-purple-50 p-2 rounded-lg text-sm">
                                  • {suggestion}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="reasoning" className="space-y-4">
                      {details ? (
                        <div className="space-y-4">
                          <Card className="border-orange-200 bg-orange-50/50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
                                <Brain className="h-4 w-4" />
                                Effort Reasoning
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-800 text-sm">
                                {details.reasoning?.effort_reasoning || "Effort reasoning not available"}
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="border-purple-200 bg-purple-50/50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-purple-800 flex items-center gap-2">
                                <Award className="h-4 w-4" />
                                Quality Reasoning
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-800 text-sm">
                                {details.reasoning?.quality_reasoning || "Quality reasoning not available"}
                              </p>
                            </CardContent>
                          </Card>

                          <Card className="border-indigo-200 bg-indigo-50/50">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm font-medium text-indigo-800 flex items-center gap-2">
                                <TrendingUp className="h-4 w-4" />
                                Overall Assessment
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-800 text-sm">
                                {details.reasoning?.overall_assessment || "Overall assessment not available"}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      ) : loadingDetails.has(submission.id) ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
                          <p className="text-gray-500">Loading AI reasoning...</p>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">Click to load detailed AI reasoning...</p>
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
    </div>
  );
};