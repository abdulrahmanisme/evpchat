// Test script to verify the evaluate-reflection Edge Function
const testReflection = async () => {
  const testData = {
    reflection_id: 'test-123',
    principle: 'Ownership',
    question: 'What did you take ownership of this week?',
    response: 'I took ownership of organizing our team meeting and ensuring everyone had clear action items. I also volunteered to lead the presentation to stakeholders.',
    user_id: 'test-user-123',
    detailed: true
  };

  try {
    const response = await fetch('https://mxfjaawvdwcmvogimzxq.supabase.co/functions/v1/evaluate-reflection', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY' // Replace with actual anon key
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('Test result:', result);
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Uncomment to run test
// testReflection();
