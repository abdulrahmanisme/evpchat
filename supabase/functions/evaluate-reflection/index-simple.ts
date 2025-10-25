import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }

  try {
    const { reflection_id: reflection_id1, principle: principle1, question: question1, response: response1, user_id: user_id1, detailed: detailed1 } = await req.json();

    if (!reflection_id1 || !principle1 || !question1 || !response1 || !user_id1) {
      return new Response(JSON.stringify({
        error: 'Missing required fields'
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('Gemini API key not found');
      return new Response(JSON.stringify({
        error: 'AI service not configured'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    // Evaluate reflection using Gemini with 2-metric system (Effort and Quality only)
    const evaluation = await evaluateReflectionWithGemini(principle1, question1, response1, geminiApiKey, detailed1);

    // Update the reflection with AI scores (only Effort and Quality)
    const { error: updateError } = await supabase
      .from('reflections')
      .update({
        effort_score: evaluation.effort_score,
        quality_score: evaluation.quality_score,
        updated_at: new Date().toISOString()
      })
      .eq('id', reflection_id1);

    if (updateError) {
      console.error('Error updating reflection:', updateError);
      return new Response(JSON.stringify({
        error: 'Failed to update reflection'
      }), {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      evaluation: {
        effort_score: evaluation.effort_score,
        quality_score: evaluation.quality_score,
        feedback: evaluation.feedback,
        suggestions: evaluation.suggestions
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });

  } catch (error) {
    console.error('Error in evaluate-reflection function:', error);
    console.error('Request details:', {
      reflection_id: reflection_id1,
      principle: principle1,
      question: question1?.substring(0, 50) + '...',
      response: response1?.substring(0, 50) + '...',
      user_id: user_id1,
      detailed: detailed1
    });

    return new Response(JSON.stringify({
      error: error.message,
      details: 'Check function logs for more information'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});

async function evaluateReflectionWithGemini(principle1, question1, response1, apiKey, detailed1 = false) {
  const detailedPrompt = detailed1 ? `
Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "effort_score": <number 0-10>,
  "quality_score": <number 0-10>,
  "feedback": "<brief constructive feedback>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>"],
  "reasoning": {
    "effort_reasoning": "<concise explanation of effort score, citing specific examples>",
    "quality_reasoning": "<concise explanation of quality score, analyzing writing style and depth>",
    "overall_assessment": "<brief assessment of strengths and areas for improvement>"
  }
}` : `
Return ONLY a valid JSON object (no markdown, no code blocks):
{
  "effort_score": <number 0-10>,
  "quality_score": <number 0-10>,
  "feedback": "<brief constructive feedback>",
  "suggestions": ["<suggestion 1>", "<suggestion 2>"]
}`;

  const prompt = `You are an AI evaluator for a campus leadership reflection system.
Evaluate the following response based on 2 metrics (0-10 each):

**Principle:** ${principle1}
**Question:** ${question1}
**Response:** ${response1}

### Evaluation Metrics:

1. **Effort Score (0-10)**: Initiative, frequency, persistence, and dedication shown
   - Did the campus lead show initiative and proactivity?
   - Is there evidence of consistent effort and persistence?
   - Did they go above basic requirements?

2. **Quality Score (0-10)**: Measurable outcomes, effectiveness, and clarity
   - Are there specific, quantifiable results mentioned?
   - Is the response clear, well-structured, and professional?
   - Does it demonstrate effectiveness and impact?

### Consider in your evaluation:
- Specificity and concrete examples
- Learning evidence and growth mindset
- Principle demonstration and alignment
- Writing clarity and professionalism

${detailedPrompt}`;

  try {
    const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2000
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error response:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const data = await geminiResponse.json();
    console.log('Gemini API response:', JSON.stringify(data, null, 2));

    // More flexible response structure validation
    if (!data.candidates || !Array.isArray(data.candidates) || data.candidates.length === 0) {
      console.error('No candidates in response:', data);
      throw new Error('No candidates found in Gemini API response');
    }

    const candidate = data.candidates[0];
    console.log('First candidate:', JSON.stringify(candidate, null, 2));

    // Check for different possible response structures
    let aiResponse = null;
    
    if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts) && candidate.content.parts.length > 0) {
      aiResponse = candidate.content.parts[0].text;
      console.log('Found response in candidate.content.parts[0].text:', aiResponse);
    }
    else if (candidate.text) {
      aiResponse = candidate.text;
      console.log('Found response in candidate.text:', aiResponse);
    }
    else if (candidate.parts && Array.isArray(candidate.parts) && candidate.parts.length > 0) {
      aiResponse = candidate.parts[0].text;
      console.log('Found response in candidate.parts[0].text:', aiResponse);
    }
    else if (candidate.finishReason) {
      console.error('Candidate finish reason:', candidate.finishReason);
      throw new Error(`Gemini API finished with reason: ${candidate.finishReason}`);
    }
    else {
      console.error('Invalid candidate structure:', candidate);
      throw new Error('Invalid candidate structure in Gemini API response - no text content found');
    }

    if (!aiResponse || typeof aiResponse !== 'string' || aiResponse.trim().length === 0) {
      console.error('Empty or invalid AI response:', aiResponse);
      throw new Error('AI returned empty or invalid response');
    }

    console.log('Final AI response text:', aiResponse);

    // Parse the JSON response
    let evaluation;
    let cleanedResponse = aiResponse.trim();
    
    try {
      // Clean the response - remove markdown code blocks if present
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      
      cleanedResponse = cleanedResponse.trim();
      console.log('Cleaned AI response:', cleanedResponse);
      
      evaluation = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw AI response:', aiResponse);
      console.error('Cleaned AI response:', cleanedResponse);
      throw new Error(`Failed to parse AI response: ${parseError.message}`);
    }

    // Validate required fields (only Effort and Quality now)
    if (typeof evaluation.effort_score !== 'number' || 
        typeof evaluation.quality_score !== 'number') {
      throw new Error('AI response missing required score fields');
    }

    // Validate scores are within range
    evaluation.effort_score = Math.max(0, Math.min(10, evaluation.effort_score));
    evaluation.quality_score = Math.max(0, Math.min(10, evaluation.quality_score));

    console.log('Final evaluation:', evaluation);
    return evaluation;

  } catch (error) {
    console.error('Gemini API error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      apiKey: apiKey ? 'Present' : 'Missing',
      principle: principle1,
      question: question1.substring(0, 50) + '...',
      response: response1.substring(0, 50) + '...'
    });

    // Fallback evaluation with only 2 metrics
    const fallbackEvaluation = {
      effort_score: Math.min(5, Math.max(1, response1.length / 50)),
      quality_score: Math.min(5, Math.max(1, response1.split(' ').length / 20)),
      feedback: `AI evaluation failed: ${error.message}. Your reflection has been recorded and will be reviewed manually.`,
      suggestions: [
        "Try to be more specific in your examples",
        "Include more details about your learning process"
      ]
    };

    if (detailed1) {
      return {
        ...fallbackEvaluation,
        reasoning: {
          effort_reasoning: `Based on response length (${response1.length} characters), this indicates moderate effort. Longer responses typically show more dedication and thoughtfulness.`,
          quality_reasoning: `Based on word count (${response1.split(' ').length} words), this response shows basic quality. More detailed responses with specific examples would score higher.`,
          overall_assessment: `This is a standard evaluation due to AI service error: ${error.message}. The reflection has been recorded and will be reviewed manually.`
        }
      };
    }

    return fallbackEvaluation;
  }
}
