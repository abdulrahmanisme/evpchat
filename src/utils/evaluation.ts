// utils/evaluation.ts
import { supabase } from "@/integrations/supabase/client";

export async function updateUserGPA(userId: string) {
  const { error } = await supabase.rpc("update_user_gpa", { target_user: userId });
  if (error) {
    console.error("Error updating user GPA:", error);
    throw error;
  }
}

export async function getLeaderboardData() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, campus_name, gpa, total_credits, created_at')
    .order('gpa', { ascending: false });

  if (error) {
    console.error("Error fetching leaderboard data:", error);
    throw error;
  }

  return data || [];
}
