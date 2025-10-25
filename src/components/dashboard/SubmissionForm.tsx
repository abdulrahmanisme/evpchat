import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { uploadProof, getCategoryLabel, getCategoryMaxPoints } from "@/lib/supabase";

interface SubmissionFormProps {
  onSuccess: () => void;
}

const categories = [
  'campus_outreach',
  'events_attended',
  'event_contribution',
  'leadership',
  'collaboration',
  'communication'
];

type SubmissionCategory = 'campus_outreach' | 'events_attended' | 'event_contribution' | 'leadership' | 'collaboration' | 'communication';

export const SubmissionForm = ({ onSuccess }: SubmissionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<SubmissionCategory | "">("");
  const [numericValue, setNumericValue] = useState<number | undefined>();
  const [textValue, setTextValue] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!category) {
      toast.error("Please select a category");
      return;
    }
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      let proofUrl = null;
      if (file) {
        proofUrl = await uploadProof(file, session.user.id);
      }

      const { error } = await supabase
        .from('submissions')
        .insert([{
          user_id: session.user.id,
          category: category as SubmissionCategory,
          numeric_value: numericValue,
          text_value: textValue || null,
          proof_url: proofUrl,
          status: 'pending' as const
        }]);

      if (error) throw error;

      toast.success("Submission created successfully!");
      onSuccess();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="category">Performance Category</Label>
        <Select value={category} onValueChange={(value) => setCategory(value as SubmissionCategory)} required>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {getCategoryLabel(cat)} (Max: {getCategoryMaxPoints(cat)} pts)
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {category === 'campus_outreach' && (
        <div className="space-y-2">
          <Label htmlFor="numeric_value">Number of Applications/Leads</Label>
          <Input
            id="numeric_value"
            type="number"
            min="0"
            value={numericValue || ""}
            onChange={(e) => setNumericValue(parseInt(e.target.value))}
            required
          />
        </div>
      )}

      {category === 'events_attended' && (
        <div className="space-y-2">
          <Label htmlFor="numeric_value">Number of Events</Label>
          <Input
            id="numeric_value"
            type="number"
            min="0"
            value={numericValue || ""}
            onChange={(e) => setNumericValue(parseInt(e.target.value))}
            required
          />
        </div>
      )}

      {(category === 'event_contribution' || 
        category === 'leadership' || 
        category === 'collaboration' || 
        category === 'communication') && (
        <div className="space-y-2">
          <Label htmlFor="text_value">Description</Label>
          <Textarea
            id="text_value"
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            required
            rows={4}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="file">Upload Proof (Optional)</Label>
        <Input
          id="file"
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
        />
        <p className="text-xs text-muted-foreground">
          Supported formats: JPG, PNG, PDF (Max 5MB)
        </p>
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Submitting..." : "Submit"}
      </Button>
    </form>
  );
};