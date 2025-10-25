// ===============================
// Credit-Based Evaluation Types
// ===============================

export interface CorePrinciple {
  id: string;
  name: string;
  credit_value: number;
  parameters: Record<string, string>[];
  created_at: string;
}

export interface GrowthEvaluation {
  id: string;
  user_id: string;
  principle_id: string;
  week: string;
  parameter_scores: Record<string, number>;
  growth_grade: number;
  credit_value: number;
  gpa_contribution: number;
  ai_summary?: string;
  admin_verified: boolean;
  created_at: string;
}

export interface ProfileExtension {
  id: string;
  gpa: number;
  total_credits: number;
  rank: number;
}
