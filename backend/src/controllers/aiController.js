import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

// Generate quiz using Gemini AI
export const generateQuizWithAI = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { prompt, difficulty = "medium", questionCount = 5 } = req.body;

    if (!prompt || prompt.trim().length < 10) {
      return res.status(400).json({
        message: "Prompt must be at least 10 characters long",
      });
    }

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        message: "Gemini API key not configured",
      });
    }

    // Validate question count
    const validQuestionCount = Math.min(
      Math.max(parseInt(questionCount) || 5, 1),
      20
    );

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const systemPrompt = `You are a quiz creator AI. Create a quiz based on the user's prompt with exactly ${validQuestionCount} questions.

IMPORTANT RULES:
1. Return ONLY valid JSON, no additional text or markdown
2. Use exactly this structure
3. Each question must have exactly 4 choices
4. Difficulty level: ${difficulty}
5. Questions should be diverse and educational
6. Include a mix of question types when appropriate

Required JSON format:
{
  "title": "Quiz Title Here",
  "description": "Brief description of the quiz topic",
  "questions": [
    {
      "content": "Question text here?",
      "type": "multiple-choice",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "points": 1,
      "explanation": "Brief explanation of why this is correct"
    }
  ]
}

User prompt: "${prompt.trim()}"

Create ${validQuestionCount} ${difficulty} difficulty questions. Ensure all questions are relevant, educational, and have clear correct answers.`;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    // Try to parse the JSON response
    let quizData;
    try {
      // Remove any markdown code block formatting if present
      const cleanedText = text.replace(/```json\n?|\n?```/g, "").trim();
      quizData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", text);
      return res.status(500).json({
        message:
          "Failed to parse AI response. Please try again with a different prompt.",
        debug: text.substring(0, 200) + "...",
      });
    }

    // Validate the structure
    if (
      !quizData.title ||
      !quizData.questions ||
      !Array.isArray(quizData.questions)
    ) {
      return res.status(500).json({
        message: "Invalid quiz structure from AI. Please try again.",
      });
    }

    // Validate each question
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];

      if (
        !q.content ||
        !Array.isArray(q.choices) ||
        q.choices.length !== 4 ||
        !q.correctAnswer
      ) {
        return res.status(500).json({
          message: `Invalid question ${i + 1} structure. Please try again.`,
        });
      }

      // Ensure the correct answer is one of the choices
      if (!q.choices.includes(q.correctAnswer)) {
        return res.status(500).json({
          message: `Question ${
            i + 1
          }: Correct answer not found in choices. Please try again.`,
        });
      }

      // Set default values if missing
      q.type = q.type || "multiple-choice";
      q.points = q.points || 1;
    }

    // Add metadata
    const responseData = {
      ...quizData,
      aiGenerated: true,
      prompt: prompt.trim(),
      difficulty,
      generatedAt: new Date().toISOString(),
      generatedBy: req.user.name,
    };

    res.json(responseData);
  } catch (error) {
    console.error("AI Quiz Generation Error:", error);
    res.status(500).json({
      message: "Failed to generate quiz. Please try again.",
      error: error.message,
    });
  }
};
