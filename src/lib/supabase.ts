import { supabase } from "@/integrations/supabase/client";

export const uploadProof = async (file: File, userId: string) => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  
  const { data, error } = await supabase.storage
    .from('proofs')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) throw error;
  
  const { data: { publicUrl } } = supabase.storage
    .from('proofs')
    .getPublicUrl(fileName);

  return publicUrl;
};

export const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    campus_outreach: 'Campus Outreach',
    events_attended: 'Events Attended',
    event_contribution: 'Event Contribution',
    leadership: 'Leadership',
    collaboration: 'Collaboration',
    communication: 'Communication'
  };
  return labels[category] || category;
};

export const getCategoryMaxPoints = (category: string): number => {
  const maxPoints: Record<string, number> = {
    campus_outreach: 20,
    events_attended: 15,
    event_contribution: 15,
    leadership: 15,
    collaboration: 15,
    communication: 20
  };
  return maxPoints[category] || 0;
};