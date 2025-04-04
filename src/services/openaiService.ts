import OpenAI from 'openai';

// Get environment variables with fallbacks for development
const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY || '';

// Validate environment variables
if (!openaiApiKey) {
  console.error('OpenAI API key is not properly configured');
}

// Create OpenAI client with browser compatibility
const openai = new OpenAI({
  apiKey: openaiApiKey,
  dangerouslyAllowBrowser: true // Required for frontend usage
});

/**
 * Generate content using OpenAI
 * @param prompt The prompt to send to OpenAI
 * @param options Optional configuration options
 * @returns The generated content
 */
export const generateContent = async (
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  } = {}
) => {
  try {
    const {
      model = 'gpt-3.5-turbo',
      temperature = 0.7,
      maxTokens = 1000,
      systemPrompt = 'You are a helpful assistant.'
    } = options;

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: prompt }
    ];

    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    });
    
    return {
      content: completion.choices[0].message.content,
      error: null
    };
  } catch (error) {
    console.error('Error generating content with OpenAI:', error);
    return {
      content: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Generate a learning plan for a course
 * @param courseId The course ID
 * @param audienceLevel The audience level
 * @returns The generated learning plan
 */
export const generateLearningPlan = async (courseId: string, audienceLevel: string) => {
  try {
    const response = await fetch('/api/generate-learning-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ courseId, audienceLevel }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to generate learning plan');
    }

    const data = await response.json();
    return { data: data.data, error: null };
  } catch (error) {
    console.error('Error generating learning plan:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
};

/**
 * Generate microlearning content
 * @param topic The topic to generate content for
 * @param contentType The type of content to generate
 * @returns The generated microlearning content
 */
export const generateMicrolearning = async (
  topic: string,
  contentType: 'summary' | 'quiz' | 'poll' | 'challenge'
) => {
  try {
    let systemPrompt = 'You are an educational content creator specialized in creating engaging microlearning content.';
    let prompt = '';

    switch (contentType) {
      case 'summary':
        prompt = `Create a concise summary about "${topic}" that explains the key concepts in 3-4 paragraphs.`;
        break;
      case 'quiz':
        systemPrompt += ' You create multiple-choice questions that test understanding of concepts.';
        prompt = `Create 3 multiple-choice questions about "${topic}" with 4 options each and indicate the correct answer.`;
        break;
      case 'poll':
        systemPrompt += ' You create thought-provoking poll questions that encourage reflection.';
        prompt = `Create a poll question about "${topic}" with 4-5 possible answers that would help gauge learner opinions or preferences.`;
        break;
      case 'challenge':
        systemPrompt += ' You create practical challenges that help apply theoretical knowledge.';
        prompt = `Create a practical challenge related to "${topic}" that learners can complete in 15-30 minutes to apply their knowledge.`;
        break;
    }

    return await generateContent(prompt, {
      model: 'gpt-4',
      temperature: 0.8,
      maxTokens: 1500,
      systemPrompt
    });
  } catch (error) {
    console.error(`Error generating ${contentType} for ${topic}:`, error);
    return {
      content: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Evaluate user response to a challenge or quiz
 * @param question The original question or challenge
 * @param correctAnswer The correct answer or solution
 * @param userResponse The user's response
 * @returns Feedback on the user's response
 */
export const evaluateResponse = async (
  question: string,
  correctAnswer: string,
  userResponse: string
) => {
  try {
    const prompt = `
      Question/Challenge: ${question}
      
      Correct Answer/Solution: ${correctAnswer}
      
      User's Response: ${userResponse}
      
      Evaluate the user's response compared to the correct answer. Provide:
      1. A score from 0-100
      2. What the user did well
      3. Areas for improvement
      4. Additional tips or resources
    `;

    const systemPrompt = 'You are an educational assessment expert who provides constructive, encouraging feedback while being accurate in your evaluation.';

    return await generateContent(prompt, {
      model: 'gpt-4',
      temperature: 0.5,
      maxTokens: 1000,
      systemPrompt
    });
  } catch (error) {
    console.error('Error evaluating response:', error);
    return {
      content: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Generate personalized recommendations based on user progress
 * @param userId The user ID
 * @param completedTopics Array of topics the user has completed
 * @param strugglingTopics Array of topics the user is struggling with
 * @returns Personalized recommendations
 */
export const generateRecommendations = async (
  userId: string,
  completedTopics: string[],
  strugglingTopics: string[]
) => {
  try {
    const prompt = `
      User has completed the following topics: ${completedTopics.join(', ')}
      
      User is struggling with the following topics: ${strugglingTopics.join(', ')}
      
      Based on this information, provide:
      1. 3 recommended topics to focus on next
      2. 2 specific resources or exercises for each struggling topic
      3. A suggested learning path for the next week
    `;

    const systemPrompt = 'You are an adaptive learning specialist who creates personalized learning recommendations based on user progress and challenges.';

    return await generateContent(prompt, {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1200,
      systemPrompt
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return {
      content: null,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export default {
  generateContent,
  generateLearningPlan,
  generateMicrolearning,
  evaluateResponse,
  generateRecommendations
};
