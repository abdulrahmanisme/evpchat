// Test script for evaluate-reflection Edge Function
// Run this with: node test-edge-function.js

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://mxfjaawvdwcmvogimzxq.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testEdgeFunction() {
  console.log('🧪 Testing evaluate-reflection Edge Function...\n');
  
  const testData = {
    reflection_id: `test-${Date.now()}`,
    principle: 'Collaboration',
    question: 'Describe a successful team project you were part of.',
    response: 'I collaborated with a cross-department team to organize a campus-wide event. We worked together for 3 weeks, coordinated with 15 team members, and successfully organized an event that attracted over 200 students. The project taught me valuable lessons about communication, delegation, and working under pressure.',
    user_id: 'test-user-123',
    detailed: false
  };

  console.log('📤 Sending test request...');
  console.log('URL:', `${SUPABASE_URL}/functions/v1/evaluate-reflection`);
  console.log('Payload:', JSON.stringify(testData, null, 2));
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
    console.log('📥 Response Headers:', Object.fromEntries(response.headers.entries()));
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

// Check if required environment variables are set
if (!SUPABASE_ANON_KEY) {
  console.error('❌ Error: VITE_SUPABASE_ANON_KEY environment variable is not set');
  console.log('\nTo fix this, create a .env file with:');
  console.log('VITE_SUPABASE_URL=https://mxfjaawvdwcmvogimzxq.supabase.co');
  console.log('VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  console.log('\nOr set them in your shell:');
  console.log('export VITE_SUPABASE_ANON_KEY=your-key-here');
  process.exit(1);
}

testEdgeFunction();
