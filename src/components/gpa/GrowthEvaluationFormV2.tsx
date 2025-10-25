import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BookOpen, Star, Calendar } from "lucide-react";
import { CorePrinciple, GrowthEvaluation } from "@/types/evaluation";

interface GrowthEvaluationFormProps {
  onSuccess: () => void;
}

export const GrowthEvaluationForm = ({ onSuccess }: GrowthEvaluationFormProps) => {
  const [principles, setPrinciples] = useState<CorePrinciple[]>([]);
  const [selectedPrinciple, setSelectedPrinciple] = useState<string>("");
  const [week, setWeek] = useState<string>("");
  const [parameterScores, setParameterScores] = useState<Record<string, number>>({});
  const [growthGrade, setGrowthGrade] = useState<number>(5);
  const [reflectionText, setReflectionText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrinciples();
    // Set default week to current date
    setWeek(new Date().toISOString().split('T')[0]);
  }, []);

  const loadPrinciples = async () => {
    try {
      const { data, error } = await supabase
        .from('core_principles')
        .select('*')
        .order('name');

      if (error) throw error;
      setPrinciples(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleParameterScoreChange = (parameter: string, score: number) => {
    setParameterScores(prev => ({
      ...prev,
      [parameter]: score
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPrinciple) {
      toast.error("Please select a core principle");
      return;
    }
    if (!reflectionText.trim()) {
      toast.error("Please provide a reflection");
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const principle = principles.find(p => p.id === selectedPrinciple);
      if (!principle) throw new Error("Principle not found");

      const { error } = await supabase
        .from('growth_evaluations')
        .insert([{
          user_id: session.user.id,
          principle_id: selectedPrinciple,
          week: week,
          parameter_scores: parameterScores,
          growth_grade: growthGrade,
          credit_value: principle.credit_value,
          ai_summary: reflectionText, // Using reflection as AI summary for now
          admin_verified: false
        }]);

      if (error) throw error;

      toast.success("Growth evaluation submitted successfully!");
      setSelectedPrinciple("");
      setParameterScores({});
      setGrowthGrade(5);
      setReflectionText("");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const selectedPrincipleData = principles.find(p => p.id === selectedPrinciple);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Submit Growth Evaluation
        </CardTitle>
        <CardDescription>
          Reflect on your growth and submit an evaluation for one of the core principles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="principle">Core Principle</Label>
            <Select value={selectedPrinciple} onValueChange={setSelectedPrinciple} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a core principle" />
              </SelectTrigger>
              <SelectContent>
                {principles.map((principle) => (
                  <SelectItem key={principle.id} value={principle.id}>
                    <div className="flex items-center gap-2">
                      <span>{principle.name}</span>
                      <Badge variant="outline">
                        {principle.credit_value} credits
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="week">Week</Label>
            <Input
              id="week"
              type="date"
              value={week}
              onChange={(e) => setWeek(e.target.value)}
              required
            />
          </div>

          {selectedPrincipleData && (
            <div className="p-3 bg-muted rounded-md">
              <h4 className="font-medium mb-2">{selectedPrincipleData.name}</h4>
              <div className="flex items-center gap-4 text-sm">
                <span>Credit Value: <strong>{selectedPrincipleData.credit_value}</strong></span>
              </div>
              
              {/* Parameter Scores */}
              {selectedPrincipleData.parameters && selectedPrincipleData.parameters.length > 0 && (
                <div className="mt-3 space-y-2">
                  <Label className="text-sm font-medium">Parameter Scores (1-10)</Label>
                  {selectedPrincipleData.parameters.map((param, index) => {
                    const paramKey = Object.keys(param)[0];
                    return (
                      <div key={index} className="flex items-center gap-2">
                        <Label className="text-sm w-32">{paramKey}:</Label>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          value={parameterScores[paramKey] || 5}
                          onChange={(e) => handleParameterScoreChange(paramKey, parseInt(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-xs text-muted-foreground">{param[paramKey]}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="growthGrade">Overall Growth Grade (0-10)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="growthGrade"
                type="number"
                min="0"
                max="10"
                step="0.1"
                value={growthGrade}
                onChange={(e) => setGrowthGrade(parseFloat(e.target.value))}
                className="w-24"
                required
              />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= growthGrade 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({growthGrade.toFixed(1)}/10)
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reflection">Reflection</Label>
            <Textarea
              id="reflection"
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="Describe your experience, what you learned, challenges faced, and how you demonstrated this core principle..."
              required
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about your actions, outcomes, and personal growth related to this principle.
            </p>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Submitting..." : "Submit Evaluation"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
