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
import { Star, BookOpen, Target, Users, Award, Zap } from "lucide-react";

interface CorePrinciple {
  id: string;
  name: string;
  description: string;
  max_credits: number;
  parameters: any;
  weight: number;
}

interface GrowthEvaluationFormProps {
  onSuccess: () => void;
}

const principleIcons: Record<string, any> = {
  'Ownership': Target,
  'Innovation': Zap,
  'Collaboration': Users,
  'Excellence': Award,
  'Impact': BookOpen,
};

export const GrowthEvaluationForm = ({ onSuccess }: GrowthEvaluationFormProps) => {
  const [principles, setPrinciples] = useState<CorePrinciple[]>([]);
  const [selectedPrinciple, setSelectedPrinciple] = useState<string>("");
  const [reflectionText, setReflectionText] = useState("");
  const [effortScore, setEffortScore] = useState<number>(3);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrinciples();
  }, []);

  const loadPrinciples = async () => {
    try {
      const { data, error } = await supabase
        .from('core_principles')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setPrinciples(data || []);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const calculateCredits = (effort: number, maxCredits: number) => {
    // Convert effort score (1-5) to credits (0-max_credits)
    // 1 = 0%, 2 = 25%, 3 = 50%, 4 = 75%, 5 = 100%
    return (effort - 1) * (maxCredits / 4.0);
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

      const creditsEarned = calculateCredits(effortScore, principle.max_credits);

      const { error } = await supabase
        .from('growth_evaluations')
        .insert([{
          user_id: session.user.id,
          principle_id: selectedPrinciple,
          reflection_text: reflectionText,
          effort_score: effortScore,
          credits_earned: creditsEarned,
          status: 'pending'
        }]);

      if (error) throw error;

      toast.success("Growth evaluation submitted successfully!");
      setSelectedPrinciple("");
      setReflectionText("");
      setEffortScore(3);
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
                {principles.map((principle) => {
                  const IconComponent = principleIcons[principle.name] || BookOpen;
                  return (
                    <SelectItem key={principle.id} value={principle.id}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        <span>{principle.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {principle.max_credits} credits
                        </Badge>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedPrincipleData && (
            <div className="p-3 bg-muted rounded-md">
              <h4 className="font-medium mb-2">{selectedPrincipleData.name}</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {selectedPrincipleData.description}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span>Max Credits: <strong>{selectedPrincipleData.max_credits}</strong></span>
                <span>Weight: <strong>{selectedPrincipleData.weight}</strong></span>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="effort">Effort Score (1-5)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="effort"
                type="number"
                min="1"
                max="5"
                value={effortScore}
                onChange={(e) => setEffortScore(parseInt(e.target.value))}
                className="w-20"
                required
              />
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= effortScore 
                        ? 'text-yellow-400 fill-yellow-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                ({effortScore === 1 && 'Minimal'} 
                {effortScore === 2 && 'Low'} 
                {effortScore === 3 && 'Moderate'} 
                {effortScore === 4 && 'High'} 
                {effortScore === 5 && 'Exceptional'})
              </span>
            </div>
            {selectedPrincipleData && (
              <p className="text-xs text-muted-foreground">
                Credits earned: <strong>{calculateCredits(effortScore, selectedPrincipleData.max_credits).toFixed(2)}</strong>
              </p>
            )}
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
