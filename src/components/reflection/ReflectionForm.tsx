import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Target, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  Star, 
  Zap,
  Trophy,
  Sparkles,
  BookOpen,
  Users,
  Lightbulb,
  TrendingUp
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ReflectionQuestion {
  id: string;
  principle: string;
  question: string;
  credit_value: number;
  order_index: number;
}

interface ReflectionSubmission {
  principle: string;
  question: string;
  response: string;
}

interface ReflectionFormProps {
  onSuccess: () => void;
}

const principleIcons = {
  'Ownership': Target,
  'Learning by Doing': BookOpen,
  'Collaboration': Users,
  'Innovation': Lightbulb,
  'Impact': TrendingUp
};

const principleColors = {
  'Ownership': 'from-blue-500 to-blue-600',
  'Learning by Doing': 'from-green-500 to-green-600',
  'Collaboration': 'from-purple-500 to-purple-600',
  'Innovation': 'from-orange-500 to-orange-600',
  'Impact': 'from-pink-500 to-pink-600'
};

export const ReflectionForm = ({ onSuccess }: ReflectionFormProps) => {
  const [questions, setQuestions] = useState<ReflectionQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [completedPrinciples, setCompletedPrinciples] = useState<Set<string>>(new Set());
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentPrinciple, setCurrentPrinciple] = useState<string>('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('reflection_questions')
        .select('*')
        .order('principle, order_index');

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load reflection questions');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, response: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: response
    }));

    // Check if all questions for this principle are answered
    const principle = questions.find(q => q.id === questionId)?.principle;
    if (principle) {
      const principleQuestions = questions.filter(q => q.principle === principle);
      const answeredQuestions = principleQuestions.filter(q => responses[q.id]?.trim() || response.trim());
      
      if (answeredQuestions.length === principleQuestions.length) {
        setCompletedPrinciples(prev => new Set([...prev, principle]));
      } else {
        setCompletedPrinciples(prev => {
          const newSet = new Set(prev);
          newSet.delete(principle);
          return newSet;
        });
      }
    }
  };

  const handleSubmit = async () => {
    if (Object.keys(responses).length === 0) {
      toast.error('Please answer at least one question');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      // Prepare submissions
      const submissions: ReflectionSubmission[] = Object.entries(responses)
        .filter(([_, response]) => response.trim())
        .map(([questionId, response]) => {
          const question = questions.find(q => q.id === questionId);
          return {
            principle: question?.principle || '',
            question: question?.question || '',
            response: response.trim()
          };
        });

      // Insert reflections
      const reflectionInserts = submissions.map(submission => ({
        user_id: session.user.id,
        principle: submission.principle,
        question: submission.question,
        response: submission.response,
        credit_value: 1
      }));

      const { data: insertedReflections, error: insertError } = await supabase
        .from('reflections')
        .insert(reflectionInserts)
        .select('id, principle, question, response');

      if (insertError) throw insertError;

      // Trigger AI evaluation for each reflection
      const evaluationPromises = insertedReflections.map(reflection => 
        supabase.functions.invoke('evaluate-reflection', {
          body: {
            reflection_id: reflection.id,
            principle: reflection.principle,
            question: reflection.question,
            response: reflection.response,
            user_id: session.user.id,
            detailed: true // Enable detailed AI reasoning
          }
        })
      );

      await Promise.all(evaluationPromises);

      // Show celebration
      setShowCelebration(true);
      toast.success('🎉 Reflections submitted successfully! AI evaluation in progress...', {
        duration: 4000,
        style: {
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold'
        }
      });

      // Reset form after celebration
      setTimeout(() => {
        setResponses({});
        setCompletedPrinciples(new Set());
        setShowCelebration(false);
        onSuccess();
      }, 3000);

    } catch (error: any) {
      console.error('Submission error:', error);
      toast.error(error.message || 'Failed to submit reflections');
    } finally {
      setSubmitting(false);
    }
  };

  const groupedQuestions = questions.reduce((acc, question) => {
    if (!acc[question.principle]) {
      acc[question.principle] = [];
    }
    acc[question.principle].push(question);
    return acc;
  }, {} as Record<string, ReflectionQuestion[]>);

  const totalQuestions = questions.length;
  const answeredQuestions = Object.values(responses).filter(r => r.trim()).length;
  const progressPercentage = (answeredQuestions / totalQuestions) * 100;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading reflection questions...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Celebration Animation */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-8 rounded-2xl text-center shadow-2xl"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Reflections Submitted!</h2>
              <p className="text-lg">AI evaluation in progress...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Header */}
      <Card className="rounded-xl border-2 border-gradient-to-r from-blue-500 to-purple-500 bg-gradient-to-br from-white to-blue-50 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🚀 Reflection Submission System
            </CardTitle>
            {completedPrinciples.size > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"
              >
                <Trophy className="h-4 w-4" />
                {completedPrinciples.size} principles completed!
              </motion.div>
            )}
          </div>
          <CardDescription className="text-base">
            Share your entrepreneurial journey through structured reflections
          </CardDescription>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Progress</span>
              <span className="text-blue-600 font-bold">{answeredQuestions}/{totalQuestions}</span>
            </div>
            <div className="relative">
              <Progress 
                value={progressPercentage} 
                className="h-3 bg-gray-200 rounded-full overflow-hidden"
              />
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Reflection Questions by Principle */}
      <div className="space-y-6">
        {Object.entries(groupedQuestions).map(([principle, principleQuestions]) => {
          const IconComponent = principleIcons[principle as keyof typeof principleIcons] || Target;
          const isCompleted = completedPrinciples.has(principle);
          
          return (
            <motion.div
              key={principle}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Card className={`rounded-xl border-2 transition-all duration-300 ${
                isCompleted 
                  ? 'border-green-500 bg-gradient-to-br from-green-50 to-white shadow-lg' 
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${principleColors[principle as keyof typeof principleColors]} shadow-lg`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <IconComponent className="h-6 w-6 text-white" />
                      </motion.div>
                      <div>
                        <CardTitle className="text-xl font-bold">{principle}</CardTitle>
                        <CardDescription>
                          {principleQuestions.length} reflection questions
                        </CardDescription>
                      </div>
                    </div>
                    {isCompleted && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Completed
                      </motion.div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {principleQuestions.map((question, index) => (
                    <motion.div
                      key={question.id}
                      className="space-y-3"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 mb-2">
                            {question.question}
                          </p>
                          <Textarea
                            value={responses[question.id] || ''}
                            onChange={(e) => handleResponseChange(question.id, e.target.value)}
                            placeholder="Share your thoughts and experiences..."
                            className="min-h-[100px] resize-none border-2 border-gray-200 focus:border-blue-500 transition-colors duration-200"
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Submit Button */}
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button 
          onClick={handleSubmit}
          className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
          disabled={submitting || answeredQuestions === 0}
        >
          {submitting ? (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Submitting Reflections...</span>
            </motion.div>
          ) : (
            <motion.div
              className="flex items-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Sparkles className="h-5 w-5" />
              <span>Submit Reflections ({answeredQuestions} answered) 🚀</span>
            </motion.div>
          )}
        </Button>
      </motion.div>
    </div>
  );
};
