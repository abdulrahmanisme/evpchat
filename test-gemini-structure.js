// Test script to check Gemini API response structure
const testGeminiResponse = async () => {
  const testData = {
    contents: [
      {
        parts: [
          {
            text: "Respond with a JSON object: {\"effort_score\": 8, \"quality_score\": 7, \"feedback\": \"Great work!\", \"suggestions\": [\"Keep it up!\"]}"
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 500
    }
  };

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=YOUR_API_KEY', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testData)
    });

    const data = await response.json();
    console.log('Full Gemini API Response Structure:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check the structure
    console.log('\nStructure Analysis:');
    console.log('data.candidates:', data.candidates);
    console.log('data.candidates[0]:', data.candidates?.[0]);
    console.log('data.candidates[0].content:', data.candidates?.[0]?.content);
    console.log('data.candidates[0].content.parts:', data.candidates?.[0]?.content?.parts);
    console.log('data.candidates[0].content.parts[0]:', data.candidates?.[0]?.content?.parts?.[0]);
    console.log('data.candidates[0].content.parts[0].text:', data.candidates?.[0]?.content?.parts?.[0]?.text);
    
  } catch (error) {
    console.error('Test error:', error);
  }
};

// Uncomment to run test
// testGeminiResponse();
