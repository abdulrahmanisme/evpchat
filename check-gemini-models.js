// Test script to check available Gemini models
const checkAvailableModels = async () => {
  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY');
    const data = await response.json();
    
    console.log('Available Gemini Models:');
    console.log(JSON.stringify(data, null, 2));
    
    // Filter for generateContent supported models
    if (data.models) {
      const generateContentModels = data.models.filter(model => 
        model.supportedGenerationMethods && 
        model.supportedGenerationMethods.includes('generateContent')
      );
      
      console.log('\nModels supporting generateContent:');
      generateContentModels.forEach(model => {
        console.log(`- ${model.name}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking models:', error);
  }
};

// Uncomment to run test
// checkAvailableModels();
