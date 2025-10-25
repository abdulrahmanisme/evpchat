// Simple test script for evaluate-reflection Edge Function
// Run this with: node test-edge-function-simple.js

const SUPABASE_URL = 'https://mxfjaawvdwcmvogimzxq.supabase.co';

async function testEdgeFunction() {
  console.log('🧪 Testing evaluate-reflection Edge Function...\n');
  
  // Get the anon key from the user
  const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
  
  if (!SUPABASE_ANON_KEY) {
    console.error('❌ Error: SUPABASE_ANON_KEY environment variable is not set');
    console.log('\nTo fix this, run:');
    console.log('  $env:SUPABASE_ANON_KEY="your-anon-key-here"');
    console.log('  node test-edge-function-simple.js');
    console.log('\nGet your anon key from: https://supabase.com/dashboard/project/mxfjaawvdwcmvogimzxq/settings/api');
    process.exit(1);
  }

  const testData = {
    reflection_id: crypto.randomUUID(), // Generate valid UUID
    principle: 'Collaboration',
    question: 'Describe a successful team project you were part of.',
    response: 'I collaborated with a cross-department team to organize a campus-wide event. We worked together for 3 weeks, coordinated with 15 team members, and successfully organized an event that attracted over 200 students. The project taught me valuable lessons about communication, delegation, and working under pressure.',
    user_id: crypto.randomUUID(), // Generate valid UUID
    detailed: false
  };

  console.log('📤 Sending test request...');
  console.log('URL:', `${SUPABASE_URL}/functions/v1/evaluate-reflection`);
  console.log('Reflection ID:', testData.reflection_id);
  console.log('\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/evaluate-reflection`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(testData)
    });

    console.log('📥 Response Status:', response.status);
    console.log('\n');

    const data = await response.text();
    
    try {
      const jsonData = JSON.parse(data);
      console.log('✅ JSON Response:');
      console.log(JSON.stringify(jsonData, null, 2));
      
      // Validate response structure
      if (jsonData.success) {
        console.log('\n✅ SUCCESS: Edge Function is working!');
        console.log('📊 Evaluation Summary:');
        if (jsonData.evaluation) {
          console.log(`   Effort Score: ${jsonData.evaluation.effort_score}/10`);
          console.log(`   Quality Score: ${jsonData.evaluation.quality_score}/10`);
          console.log(`   Depth Score: ${jsonData.evaluation.depth_score}/10`);
          console.log(`   Scale Score: ${jsonData.evaluation.scale_score}/10`);
        }
      } else {
        console.log('\n❌ FAILED: Unexpected response structure');
        if (jsonData.error) {
          console.log('Error:', jsonData.error);
        }
      }
    } catch (parseError) {
      console.log('⚠️  Could not parse response as JSON:');
      console.log(data);
    }

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEdgeFunction();
