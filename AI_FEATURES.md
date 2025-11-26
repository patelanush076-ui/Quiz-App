# AI Quiz Generation Feature

## Overview

Create quizzes automatically using Google's Gemini AI. Simply describe your quiz topic, and the AI will generate questions, answers, and explanations for you.

## Setup

### 1. Get Gemini API Key

1. Visit [Google AI Studio](https://ai.google.dev/tutorials/setup)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key

### 2. Configure Environment

Add your Gemini API key to the backend `.env` file:

```
GEMINI_API_KEY="your-actual-api-key-here"
```

### 3. Install Dependencies

```bash
cd backend
npm install @google/generative-ai
```

## How to Use

### For Users

1. **Login** to your account
2. Click **🤖 Create with AI** on the home page
3. **Describe your quiz** in detail:
   - Topic/subject area
   - Specific learning objectives
   - Target audience level
4. **Select settings**:
   - Difficulty level (Easy/Medium/Hard)
   - Number of questions (1-20)
5. **Generate** and wait for AI to create your quiz
6. **Review and edit** the generated questions
7. **Create quiz** when satisfied

### Example Prompts

- "Create a quiz about JavaScript fundamentals including variables, functions, and arrays"
- "Make a history quiz about World War II events and key figures"
- "Generate a science quiz covering basic chemistry and the periodic table"
- "Create a geography quiz about European countries and their capitals"

## Features

### AI Generation

- ✅ **Smart Question Creation**: AI generates relevant, educational questions
- ✅ **Multiple Choice Format**: Each question has 4 answer options
- ✅ **Difficulty Scaling**: AI adjusts complexity based on selected level
- ✅ **Topic Relevance**: Questions stay focused on your specified subject

### Review & Edit

- ✅ **Full Editing**: Modify questions, answers, and explanations
- ✅ **Add/Remove Questions**: Customize the question count
- ✅ **Real-time Preview**: See how questions will appear to participants
- ✅ **Manual Override**: Complete control over all quiz elements

### Integration

- ✅ **Seamless Workflow**: AI-generated quizzes work with all existing features
- ✅ **Same Functionality**: Deadlines, sharing, results, and analytics all work
- ✅ **No Limitations**: Edit AI quizzes just like manually created ones

## API Endpoints

### Generate Quiz with AI

```
POST /api/ai/generate-quiz
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "prompt": "Create a quiz about JavaScript fundamentals",
  "difficulty": "medium",
  "questionCount": 5
}
```

### Response Format

```json
{
  "title": "JavaScript Fundamentals Quiz",
  "description": "Test your knowledge of JavaScript basics",
  "questions": [
    {
      "content": "What is a variable in JavaScript?",
      "type": "multiple-choice",
      "choices": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "points": 1,
      "explanation": "Brief explanation of the answer"
    }
  ],
  "aiGenerated": true,
  "prompt": "Original user prompt",
  "difficulty": "medium",
  "generatedAt": "2025-11-26T...",
  "generatedBy": "username"
}
```

## Technical Implementation

### Backend (`aiController.js`)

- **Google AI Integration**: Uses Gemini Pro model
- **Prompt Engineering**: Structured prompts for consistent output
- **JSON Validation**: Ensures AI response matches expected format
- **Error Handling**: Graceful fallbacks for API failures
- **Security**: Requires authentication, validates input

### Frontend Components

- **AIQuizGenerator**: Input form for AI generation
- **AIQuizPreview**: Review and edit AI-generated content
- **QuizBuilder Integration**: Seamless transition to manual editing

### Data Flow

1. User describes quiz → AI generation request
2. Gemini API processes → Structured JSON response
3. Frontend validation → Preview interface
4. User customization → Standard quiz creation
5. Final quiz creation → Normal quiz workflow

## Error Handling

### Common Issues

- **Invalid API Key**: Check `.env` configuration
- **API Quota Exceeded**: Monitor usage in Google AI Studio
- **Malformed Response**: AI occasionally returns invalid JSON
- **Network Issues**: Temporary connectivity problems

### Fallback Behavior

- **Parse Errors**: Clear error message, option to retry
- **API Failures**: Graceful degradation to manual creation
- **Validation Errors**: Specific feedback on what needs fixing
- **Rate Limits**: Informative waiting messages

## Best Practices

### Writing Effective Prompts

1. **Be Specific**: Include subject, difficulty, and focus areas
2. **Provide Context**: Mention target audience or learning goals
3. **Use Examples**: Reference specific topics or concepts
4. **Set Scope**: Define breadth vs. depth of coverage

### Review Process

1. **Check Questions**: Ensure clarity and accuracy
2. **Verify Answers**: Confirm correct options are properly marked
3. **Edit Content**: Improve wording or add context
4. **Test Logic**: Make sure questions test intended knowledge

## Future Enhancements

- **Question Type Variety**: Support for text input, multi-select
- **Image Integration**: AI-generated visual questions
- **Difficulty Analysis**: AI assessment of question complexity
- **Learning Objectives**: Automatic curriculum alignment
- **Bulk Generation**: Create multiple related quizzes
