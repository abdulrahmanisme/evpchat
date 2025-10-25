import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ReflectionForm } from "@/components/reflection/ReflectionForm";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { User, Calendar, TrendingUp, Target, Clock, ArrowRight, Users, Lightbulb, BookOpen, Sparkles } from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import CalendarModal from "@/components/calendar/CalendarModal";

interface Profile {
  name: string;
  campus_name: string;
  course: string;
  batch: string;
  total_score: number;
  bonus_points: number;
  joined_evp_on?: string;
}

interface AttendanceData {
  days_attended: number;
  total_days: number;
  attendance_percentage: number;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showReflectionForm, setShowReflectionForm] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [currentPrinciple, setCurrentPrinciple] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [attendance, setAttendance] = useState<AttendanceData>({
    days_attended: 15,
    total_days: 20,
    attendance_percentage: 75
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  const buttonVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut"
      }
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2
      }
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1
      }
    }
  };

  // Sample data for pie chart
  const pieData = [
    { name: 'Completed Tasks', value: 8, color: '#10b981' },
    { name: 'Pending Tasks', value: 3, color: '#f59e0b' },
    { name: 'In Progress', value: 2, color: '#3b82f6' }
  ];

  // Principles data
  const principles = [
    {
      name: "Collaboration",
      icon: Users,
      color: "from-purple-500 to-purple-600",
      questions: [
        "Describe a successful team project you were part of.",
        "How did you help a teammate overcome a challenge?",
        "What role did you play in fostering team communication?"
      ]
    },
    {
      name: "Impact",
      icon: TrendingUp,
      color: "from-pink-500 to-pink-600",
      questions: [
        "How did your actions positively affect others this week?",
        "What measurable results did you achieve?",
        "How did you contribute to your community or organization?"
      ]
    },
    {
      name: "Innovation",
      icon: Lightbulb,
      color: "from-orange-500 to-orange-600",
      questions: [
        "What creative solution did you come up with for a problem?",
        "How did you think outside the box this week?",
        "Describe an idea you proposed or implemented."
      ]
    },
    {
      name: "Learning by Doing",
      icon: BookOpen,
      color: "from-green-500 to-green-600",
      questions: [
        "What new skill or knowledge did you gain through hands-on experience?",
        "Describe a mistake you made and what you learned from it.",
        "How did you apply theoretical knowledge in a practical setting?"
      ]
    },
    {
      name: "Ownership",
      icon: Target,
      color: "from-blue-500 to-blue-600",
      questions: [
        "What's something you took ownership of this week?",
        "Describe a situation where you stepped up as a leader.",
        "How did you take responsibility for a project or task?"
      ]
    }
  ];

  const handleReflectionClick = () => {
    setCurrentPrinciple(0);
    setAnswers({});
    setIsDialogOpen(true);
  };

  const handleAnswerChange = (principleIndex: number, questionIndex: number, value: string) => {
    const key = `${principleIndex}-${questionIndex}`;
    setAnswers(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const isCurrentPrincipleComplete = () => {
    const currentPrincipleQuestions = principles[currentPrinciple]?.questions || [];
    return currentPrincipleQuestions.every((_, questionIndex) => {
      const key = `${currentPrinciple}-${questionIndex}`;
      return answers[key] && answers[key].trim().length > 0;
    });
  };

  const isAllPrinciplesComplete = () => {
    return principles.every((principle, principleIndex) => 
      principle.questions.every((_, questionIndex) => {
        const key = `${principleIndex}-${questionIndex}`;
        return answers[key] && answers[key].trim().length > 0;
      })
    );
  };

  const handleNextPrinciple = () => {
    if (!isCurrentPrincipleComplete()) {
      toast.error("Please answer all questions before proceeding.");
      return;
    }
    
    if (currentPrinciple < principles.length - 1) {
      setCurrentPrinciple(currentPrinciple + 1);
    } else {
      setIsDialogOpen(false);
      setCurrentPrinciple(0);
      toast.success("All reflections completed successfully!");
    }
  };

  const handlePreviousPrinciple = () => {
    if (currentPrinciple > 0) {
      setCurrentPrinciple(currentPrinciple - 1);
    }
  };

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
        .select('name, campus_name, course, batch, total_score, bonus_points, joined_evp_on')
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <div className="flex justify-end p-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
            Dashboard
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/leaderboard')}>
            Leaderboard
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            SignOut
          </Button>
        </div>
      </div>

      <motion.div 
        className="container mx-auto px-4 pb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Top Row - 3 Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Campus Lead Profile Card */}
          <motion.div variants={cardVariants}>
            <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5 text-green-600" />
                Campus Lead
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-xl">{profile?.name}</h3>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {profile?.campus_name}
                    </Badge>
                    <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                      {profile?.course} • {profile?.batch}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-3 rounded-lg flex-1 mr-2">
                    <p className="text-2xl font-bold text-green-700">#{profile?.total_score || 0}</p>
                    <p className="text-xs text-green-600 font-medium">Total Score</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg flex-1 ml-2 border">
                    <p className="text-lg font-semibold text-gray-800">{profile?.joined_evp_on ? new Date(profile.joined_evp_on).getFullYear() : 'N/A'}</p>
                    <p className="text-xs text-gray-600 font-medium">Joined EVP</p>
                  </div>
                </div>
                {profile?.bonus_points && profile.bonus_points > 0 ? (
                  <div className="flex justify-center">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      +{profile.bonus_points} Bonus Points
                    </Badge>
                  </div>
                ) : null}
              </div>
            </CardContent>
            </Card>
          </motion.div>

          {/* Statistics Card */}
          <motion.div variants={cardVariants}>
            <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-center">
                  <div className="relative w-24 h-24">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={20}
                          outerRadius={40}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="flex justify-center gap-3">
                  {pieData.map((item, index) => (
                    <div key={index} className="flex items-center gap-1">
                      <div 
                        className="w-2 h-2 rounded-full" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-medium">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            </Card>
          </motion.div>

          {/* Attendance Card */}
          <motion.div variants={cardVariants}>
            <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5 text-green-600" />
                Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">{attendance.attendance_percentage}%</div>
                  <p className="text-sm text-gray-600 font-medium">Attendance Rate</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Days Attended:</span>
                    <span className="font-semibold text-gray-900">{attendance.days_attended}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-700">Total Days:</span>
                    <span className="font-semibold text-gray-900">{attendance.total_days}</span>
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${attendance.attendance_percentage}%` }}
                  />
                </div>
              </div>
            </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Bottom Row - 2 Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Entry Card */}
          <motion.div variants={cardVariants}>
            <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={handleReflectionClick}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-green-600" />
                  Add New Entry
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Create and submit new details with our easy-to-use form interface & organized data management.
                  </p>
                  <div className="flex items-center text-green-600 font-medium text-sm hover:text-green-700 transition-colors">
                    <span>OPEN FORM</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* View Events Card */}
          <motion.div variants={cardVariants}>
            <Card className="rounded-xl hover:shadow-lg transition-shadow duration-300 cursor-pointer" onClick={() => setIsCalendarOpen(true)}>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Calendar className="h-5 w-5 text-green-600" />
                  View Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Explore upcoming events, meetings & workshops with detailed schedules and locations.
                  </p>
                  <div className="flex items-center text-green-600 font-medium text-sm hover:text-green-700 transition-colors">
                    <span>SEE ALL EVENTS</span>
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Reflection Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className={`flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r ${principles[currentPrinciple]?.color} shadow-lg`}>
                  {principles[currentPrinciple] && (() => {
                    const IconComponent = principles[currentPrinciple].icon;
                    return <IconComponent className="h-6 w-6 text-white" />;
                  })()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold">{principles[currentPrinciple]?.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Principle {currentPrinciple + 1} of {principles.length}
                  </p>
                </div>
              </DialogTitle>
              <DialogDescription>
                Answer the following questions to reflect on your {principles[currentPrinciple]?.name.toLowerCase()} experiences.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 mt-6">
              {principles[currentPrinciple]?.questions.map((question, index) => {
                const answerKey = `${currentPrinciple}-${index}`;
                const currentAnswer = answers[answerKey] || '';
                const isEmpty = !currentAnswer || currentAnswer.trim().length === 0;
                
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-semibold text-sm ${
                        isEmpty ? 'bg-red-100 text-red-600 border-2 border-red-200' : 'bg-green-100 text-green-600 border-2 border-green-200'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800 mb-2">{question}</p>
                        <textarea 
                          className={`flex w-full rounded-md bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px] resize-none border-2 transition-colors duration-200 ${
                            isEmpty ? 'border-red-300 focus:border-red-500' : 'border-green-300 focus:border-green-500'
                          }`}
                          placeholder="Share your thoughts and experiences..."
                          value={currentAnswer}
                          onChange={(e) => handleAnswerChange(currentPrinciple, index, e.target.value)}
                        />
                        {isEmpty && (
                          <p className="text-red-500 text-xs mt-1">This question is required</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={handlePreviousPrinciple}
                disabled={currentPrinciple === 0}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {currentPrinciple + 1} of {principles.length}
                  </span>
                  <div className="flex gap-1">
                    {principles.map((_, index) => (
                      <div
                        key={index}
                        className={`w-2 h-2 rounded-full ${
                          index === currentPrinciple 
                            ? 'bg-blue-500' 
                            : index < currentPrinciple 
                              ? 'bg-green-500' 
                              : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={handleNextPrinciple}
                  className={`${
                    isCurrentPrincipleComplete() 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' 
                      : 'bg-gray-400 cursor-not-allowed'
                  }`}
                  disabled={!isCurrentPrincipleComplete()}
                >
                  {currentPrinciple === principles.length - 1 ? 'Finish' : 'Next'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Calendar Modal */}
        <CalendarModal 
          isOpen={isCalendarOpen} 
          onClose={() => setIsCalendarOpen(false)} 
        />
      </motion.div>
    </div>
  );
};

export default Dashboard;