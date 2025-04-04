// core/openaiService.ts

import { OpenAI } from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env?.VITE_OPENAI_API_KEY || '', // Ensure this is set in .env
  dangerouslyAllowBrowser: true, // Required when using in frontend
});

// Generate a structured learning plan from raw course input
export async function generateLearningPlan(courseText: string) {
  try {
    const systemPrompt = `
You are an expert course planner. Create a structured learning plan in JSON with 7 microlearning steps for the following content. 
Each step should include: "title", "objective", and a one-line "summary".

Be clear, simple, and appropriate for learners aged 10–16.
Output format:
[
  {
    "day": 1,
    "title": "...",
    "objective": "...",
    "summary": "..."
  },
  ...
]
    `.trim();

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: courseText }
      ],
      temperature: 0.7,
    });

    const plan = JSON.parse(response.choices[0].message.content || '[]');
    return { data: plan, error: null };
  } catch (error) {
    console.error('Error generating learning plan:', error);
    return { data: null, error };
  }
}

// Generate microlearning content for a single day
export async function generateMicrolearning(step: {
  title: string;
  objective: string;
  summary: string;
  day: number;
}) {
  try {
    const userPrompt = `
Create a 3-part microlearning lesson for:
Day ${step.day}
Title: ${step.title}
Objective: ${step.objective}
Summary: ${step.summary}

Break into 3 sections: "Intro", "Key Concept", "Quick Recap".
Respond in JSON format with keys: "intro", "concept", "recap".
`.trim();

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a microlearning content generator for school kids.' },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.8,
    });

    const lesson = JSON.parse(response.choices[0].message.content || '{}');
    return { data: lesson, error: null };
  } catch (error) {
    console.error('Error generating microlearning:', error);
    return { data: null, error };
  }
}

// Evaluate learner's response for a given expected answer
export async function evaluateResponse(userAnswer: string, expectedAnswer: string) {
  try {
    const prompt = `
Evaluate the learner's answer against the expected answer. Give a score from 1 to 5 and a short feedback sentence.

Expected Answer:
${expectedAnswer}

Learner's Answer:
${userAnswer}

Respond in JSON with: { "score": number, "feedback": "..." }
`.trim();

    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a learning coach helping evaluate answers kindly.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.6,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return { data: result, error: null };
  } catch (error) {
    console.error('Error evaluating response:', error);
    return { data: null, error };
  }
}
