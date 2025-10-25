import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ReflectionRequest {
  highlights: string;
  challenges: string;
  principle_id: string;
  user_id: string;
  effort_score?: number; // New optional effort score parameter
}

interface AIResponse {
  reflection: {
    highlights: string;
    challenges: string;
  };
  credit_suggestion: {
    effort: number;
    impact: number;
    learning: number;
    total: number;
  };
  summary: string;
  growth_grade: number;
  parameter_scores: Record<string, number>;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { highlights, challenges, principle_id, user_id, effort_score }: ReflectionRequest = await req.json()

    if (!highlights || !challenges || !principle_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get the core principle details
    const { data: principle, error: principleError } = await supabaseClient
      .from('core_principles')
      .select('*')
      .eq('id', principle_id)
      .single()

    if (principleError || !principle) {
      return new Response(
        JSON.stringify({ error: 'Principle not found' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // AI Analysis using Gemini
    const aiResponse = await analyzeReflectionWithGemini(highlights, challenges, principle, effort_score)

    // Save the evaluation to database
    const { data: evaluation, error: evaluationError } = await supabaseClient
      .from('growth_evaluations')
      .insert({
        user_id,
        principle_id,
        week: new Date().toISOString().split('T')[0],
        parameter_scores: aiResponse.parameter_scores,
        growth_grade: aiResponse.growth_grade,
        credit_value: principle.credit_value,
        ai_summary: aiResponse.summary,
        admin_verified: false
      })
      .select()
      .single()

    if (evaluationError) {
      console.error('Database error:', evaluationError)
      return new Response(
        JSON.stringify({ error: 'Failed to save evaluation' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        evaluation,
        ai_analysis: aiResponse
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function analyzeReflectionWithGemini(highlights: string, challenges: string, principle: any, effort_score?: number): Promise<AIResponse> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  
  if (!geminiApiKey) {
    console.warn('GEMINI_API_KEY not found, falling back to rule-based analysis')
    return analyzeReflectionFallback(highlights, challenges, principle, effort_score)
  }

  try {
    // Prepare the prompt for Gemini
    const prompt = createGeminiPrompt(highlights, challenges, principle, effort_score)
    
    // Call Gemini API
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const aiText = data.candidates[0].content.parts[0].text

    // Parse Gemini's response
    return parseGeminiResponse(aiText, highlights, challenges, principle)

  } catch (error) {
    console.error('Gemini API error:', error)
          console.log('Falling back to rule-based analysis')
          return analyzeReflectionFallback(highlights, challenges, principle, effort_score)
  }
}

function createGeminiPrompt(highlights: string, challenges: string, principle: any, effort_score?: number): string {
  const parameters = principle.parameters?.map((p: any) => Object.values(p)[0]).join(', ') || 'general performance'
  
  return `You are an AI assistant helping Campus Leads submit structured reflections for their events. Each reflection should be concise, insightful, and fit within our credit-based system.

**Core Principle:** ${principle.name}
**Credit Value:** ${principle.credit_value}
**Evaluation Parameters:** ${parameters}

**Campus Lead Reflection:**
1. Highlights: "${highlights}"
2. Challenges: "${challenges}"${effort_score ? `
3. Self-reported Effort Score: ${effort_score}/10` : ''}

**Instructions:**
- Analyze the reflection for effort, impact, and learning
- ${effort_score ? `Consider the self-reported effort score (${effort_score}/10) when evaluating effort dimension` : 'Score each dimension from 0-5'}
- Generate parameter scores (1-10) based on the principle parameters
- Calculate growth grade (0-10) based on overall performance
- Provide a concise 1-2 line summary

**Required JSON Output Format:**
{
  "reflection": {
    "highlights": "${highlights}",
    "challenges": "${challenges}"
  },
  "credit_suggestion": {
    "effort": <0-5>,
    "impact": <0-5>,
    "learning": <0-5>,
    "total": <sum>
  },
  "summary": "<1-2 line summary>",
  "growth_grade": <0-10>,
  "parameter_scores": {
    "<parameter_name>": <1-10>
  }
}

**Scoring Guidelines:**
- Effort (0-5): Action-oriented language, initiative, accountability, detail level
- Impact (0-5): Measurable outcomes, reach, positive results, influence
- Learning (0-5): Reflection depth, problem-solving, growth mindset, insights
- Growth Grade (0-10): Overall performance combining all factors
- Parameter Scores (1-10): Specific to each principle parameter

Respond ONLY with valid JSON, no additional text.`
}

function parseGeminiResponse(aiText: string, highlights: string, challenges: string, principle: any): AIResponse {
  try {
    // Extract JSON from the response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])
    
    // Validate and clean the response
    const response: AIResponse = {
      reflection: {
        highlights: parsed.reflection?.highlights || highlights,
        challenges: parsed.reflection?.challenges || challenges
      },
      credit_suggestion: {
        effort: Math.max(0, Math.min(5, parsed.credit_suggestion?.effort || 3)),
        impact: Math.max(0, Math.min(5, parsed.credit_suggestion?.impact || 3)),
        learning: Math.max(0, Math.min(5, parsed.credit_suggestion?.learning || 3)),
        total: 0
      },
      summary: parsed.summary || "Reflection submitted and analyzed.",
      growth_grade: Math.max(0, Math.min(10, parsed.growth_grade || 5)),
      parameter_scores: parsed.parameter_scores || {}
    }

    // Calculate total
    response.credit_suggestion.total = 
      response.credit_suggestion.effort + 
      response.credit_suggestion.impact + 
      response.credit_suggestion.learning

    // Ensure parameter scores are within bounds
    Object.keys(response.parameter_scores).forEach(key => {
      response.parameter_scores[key] = Math.max(1, Math.min(10, response.parameter_scores[key]))
    })

    return response

  } catch (error) {
    console.error('Error parsing Gemini response:', error)
    throw new Error('Failed to parse AI response')
  }
}

// Fallback rule-based analysis
async function analyzeReflectionFallback(highlights: string, challenges: string, principle: any, effort_score?: number): Promise<AIResponse> {
  const reflection = {
    highlights,
    challenges
  }

  // Analyze effort (use self-reported score if available, otherwise analyze from text)
  const effortScore = effort_score ? Math.min(5, Math.max(0, effort_score / 2)) : analyzeEffort(highlights, challenges)
  
  // Analyze impact (based on outcomes, reach, and measurable results)
  const impactScore = analyzeImpact(highlights, challenges)
  
  // Analyze learning (based on reflection depth, insights, and growth mindset)
  const learningScore = analyzeLearning(highlights, challenges)

  const creditSuggestion = {
    effort: effortScore,
    impact: impactScore,
    learning: learningScore,
    total: effortScore + impactScore + learningScore
  }

  // Generate summary
  const summary = generateSummary(highlights, challenges, principle.name)

  // Calculate growth grade (0-10 scale)
  const growthGrade = Math.min(10, (creditSuggestion.total / 15) * 10)

  // Generate parameter scores based on principle parameters
  const parameterScores = generateParameterScores(principle, highlights, challenges)

  return {
    reflection,
    credit_suggestion: creditSuggestion,
    summary,
    growth_grade: Math.round(growthGrade * 10) / 10, // Round to 1 decimal
    parameter_scores: parameterScores
  }
}

function analyzeEffort(highlights: string, challenges: string): number {
  let score = 1 // Base score
  
  // Check for specific actions and initiatives
  const actionWords = ['organized', 'created', 'implemented', 'led', 'managed', 'coordinated', 'developed']
  const actionCount = actionWords.filter(word => 
    highlights.toLowerCase().includes(word) || challenges.toLowerCase().includes(word)
  ).length
  
  score += Math.min(2, actionCount * 0.5)
  
  // Check for detail and specificity
  const wordCount = (highlights + challenges).split(' ').length
  if (wordCount > 100) score += 1
  if (wordCount > 200) score += 1
  
  // Check for accountability and ownership
  if (highlights.toLowerCase().includes('i ') || challenges.toLowerCase().includes('i ')) {
    score += 0.5
  }
  
  return Math.min(5, Math.round(score))
}

function analyzeImpact(highlights: string, challenges: string): number {
  let score = 1 // Base score
  
  // Check for measurable outcomes
  const numbers = /\d+/.test(highlights + challenges)
  if (numbers) score += 1
  
  // Check for reach indicators
  const reachWords = ['team', 'students', 'community', 'campus', 'participants', 'audience']
  const reachCount = reachWords.filter(word => 
    highlights.toLowerCase().includes(word) || challenges.toLowerCase().includes(word)
  ).length
  
  score += Math.min(2, reachCount * 0.5)
  
  // Check for positive outcomes
  const positiveWords = ['successful', 'achieved', 'improved', 'increased', 'gained', 'won']
  const positiveCount = positiveWords.filter(word => 
    highlights.toLowerCase().includes(word)
  ).length
  
  score += Math.min(1, positiveCount * 0.5)
  
  return Math.min(5, Math.round(score))
}

function analyzeLearning(highlights: string, challenges: string): number {
  let score = 1 // Base score
  
  // Check for reflection and insights
  const learningWords = ['learned', 'realized', 'understood', 'discovered', 'insight', 'lesson']
  const learningCount = learningWords.filter(word => 
    challenges.toLowerCase().includes(word)
  ).length
  
  score += Math.min(2, learningCount * 0.5)
  
  // Check for problem-solving approach
  const solutionWords = ['addressed', 'solved', 'overcame', 'improved', 'adapted', 'modified']
  const solutionCount = solutionWords.filter(word => 
    challenges.toLowerCase().includes(word)
  ).length
  
  score += Math.min(1, solutionCount * 0.5)
  
  // Check for growth mindset
  if (challenges.toLowerCase().includes('next time') || 
      challenges.toLowerCase().includes('future') ||
      challenges.toLowerCase().includes('improve')) {
    score += 1
  }
  
  return Math.min(5, Math.round(score))
}

function generateSummary(highlights: string, challenges: string, principleName: string): string {
  // Extract key points for summary
  const highlightWords = highlights.split(' ').slice(0, 10).join(' ')
  const challengeWords = challenges.split(' ').slice(0, 10).join(' ')
  
  return `Demonstrated ${principleName} through ${highlightWords}. Addressed challenges including ${challengeWords}.`
}

function generateParameterScores(principle: any, highlights: string, challenges: string): Record<string, number> {
  const scores: Record<string, number> = {}
  
  if (principle.parameters && Array.isArray(principle.parameters)) {
    principle.parameters.forEach((param: any) => {
      const paramKey = Object.keys(param)[0]
      const paramDescription = param[paramKey].toLowerCase()
      
      // Score based on parameter type and content relevance
      let score = 5 // Base score
      
      if (paramDescription.includes('effort') || paramDescription.includes('accountability')) {
        score = analyzeEffort(highlights, challenges)
      } else if (paramDescription.includes('impact') || paramDescription.includes('influence')) {
        score = analyzeImpact(highlights, challenges)
      } else if (paramDescription.includes('learning') || paramDescription.includes('growth')) {
        score = analyzeLearning(highlights, challenges)
      } else if (paramDescription.includes('creativity') || paramDescription.includes('innovation')) {
        score = analyzeCreativity(highlights, challenges)
      } else if (paramDescription.includes('teamwork') || paramDescription.includes('collaboration')) {
        score = analyzeCollaboration(highlights, challenges)
      }
      
      scores[paramKey] = Math.min(10, Math.max(1, score))
    })
  }
  
  return scores
}

function analyzeCreativity(highlights: string, challenges: string): number {
  let score = 5
  
  const creativeWords = ['creative', 'innovative', 'unique', 'original', 'new', 'different', 'creative']
  const creativeCount = creativeWords.filter(word => 
    (highlights + challenges).toLowerCase().includes(word)
  ).length
  
  score += Math.min(3, creativeCount)
  
  return Math.min(10, score)
}

function analyzeCollaboration(highlights: string, challenges: string): number {
  let score = 5
  
  const teamWords = ['team', 'together', 'collaborated', 'partnered', 'worked with', 'supported']
  const teamCount = teamWords.filter(word => 
    (highlights + challenges).toLowerCase().includes(word)
  ).length
  
  score += Math.min(3, teamCount)
  
  return Math.min(10, score)
}
