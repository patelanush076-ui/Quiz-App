import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Submit answers
export const submitAnswers = async (req, res) => {
  const { code } = req.params;
  const { participantId, answers } = req.body;
  const quiz = await prisma.quiz.findUnique({
    where: { code },
    include: { questions: true },
  });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  const participant = await prisma.participant.findUnique({
    where: { id: participantId },
  });
  if (!participant)
    return res.status(404).json({ message: "Participant not found" });

  // deadline check
  if (quiz.deadline && new Date(quiz.deadline) < new Date()) {
    return res.status(400).json({ message: "Deadline passed" });
  }

  // compute score
  let total = 0;
  const detail = {};

  for (const q of quiz.questions) {
    const userAnswer = answers[q.id];

    // Initialize detail for this question
    detail[q.id] = {
      earned: 0,
      correct: false,
      userAnswer,
      correctAnswer: q.answer,
    };

    // Skip if no answer provided
    if (userAnswer === undefined || userAnswer === null || userAnswer === "") {
      continue;
    }

    if (q.type === "multiple-choice" || q.type === "single-choice") {
      // Single choice question - exact match
      const correct =
        String(q.answer).toLowerCase() === String(userAnswer).toLowerCase();
      const earned = correct ? q.points : 0;
      detail[q.id] = { earned, correct, userAnswer, correctAnswer: q.answer };
      total += earned;
    } else if (q.type === "multi-choice") {
      // Multiple choice question - array comparison
      const correctAnswers = Array.isArray(q.answer) ? q.answer : [];
      const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];

      if (correctAnswers.length === 0) {
        continue; // No correct answers defined
      }

      // Calculate how many correct answers were selected
      const correctMatches = userAnswers.filter((ans) =>
        correctAnswers.some(
          (correct) =>
            String(correct).toLowerCase() === String(ans).toLowerCase()
        )
      ).length;

      // Calculate how many incorrect answers were selected
      const incorrectMatches = userAnswers.filter(
        (ans) =>
          !correctAnswers.some(
            (correct) =>
              String(correct).toLowerCase() === String(ans).toLowerCase()
          )
      ).length;

      // Partial scoring: (correct matches / total correct) * points - penalty for wrong selections
      const percentage =
        correctAnswers.length > 0 ? correctMatches / correctAnswers.length : 0;
      const penalty = incorrectMatches * 0.1; // Small penalty for wrong selections
      const earnedPercentage = Math.max(0, percentage - penalty);
      const earned = Math.round(earnedPercentage * q.points);
      const isFullyCorrect =
        correctMatches === correctAnswers.length && incorrectMatches === 0;

      detail[q.id] = {
        earned,
        correct: isFullyCorrect,
        userAnswer,
        correctAnswer: q.answer,
      };
      total += earned;
    } else if (q.type === "text") {
      // Text question - case-insensitive exact match
      const correct =
        String(q.answer).toLowerCase().trim() ===
        String(userAnswer).toLowerCase().trim();
      const earned = correct ? q.points : 0;
      detail[q.id] = { earned, correct, userAnswer, correctAnswer: q.answer };
      total += earned;
    } else {
      // Unknown question type - no points
      console.warn(`Unknown question type: ${q.type}`);
      detail[q.id] = {
        earned: 0,
        correct: false,
        userAnswer,
        correctAnswer: q.answer,
      };
    }
  }

  const submission = await prisma.submission.create({
    data: { participantId, quizId: quiz.id, answers, score: total },
  });
  res.json({ submission, score: total, detail });
};

// Get result for participant
export const getResults = async (req, res) => {
  try {
    const { code } = req.params;
    const { participantId } = req.query;

    const quiz = await prisma.quiz.findUnique({
      where: { code },
      include: {
        submissions: {
          include: {
            participant: true,
          },
        },
        questions: true,
      },
    });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check if user is admin or deadline has passed
    const isAdmin = req.user && req.user.id === quiz.adminId;
    const deadlinePassed =
      !quiz.deadline || new Date(quiz.deadline) <= new Date();

    if (!isAdmin && !deadlinePassed) {
      return res.status(403).json({
        message: "Results not available until deadline passes",
      });
    }

    // Calculate total possible points
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);

    // Process submissions with percentage scores
    const submissions = quiz.submissions.map((sub) => ({
      id: sub.id,
      participantId: sub.participantId,
      participant: sub.participant,
      rawScore: sub.score,
      score: totalPoints > 0 ? Math.round((sub.score / totalPoints) * 100) : 0,
      submittedAt: sub.submittedAt,
      answers: sub.answers,
    }));

    // Sort by score (descending) then by submission time (ascending)
    submissions.sort(
      (a, b) =>
        b.rawScore - a.rawScore ||
        new Date(a.submittedAt) - new Date(b.submittedAt)
    );

    const mySubmission = participantId
      ? submissions.find((s) => s.participantId === participantId)
      : null;

    res.json({
      submissions,
      totalSubmissions: submissions.length,
      totalPoints,
      mySubmission,
      quiz: {
        title: quiz.title,
        deadline: quiz.deadline,
        questionCount: quiz.questions.length,
      },
    });
  } catch (error) {
    console.error("Get results error:", error);
    res.status(500).json({ message: "Failed to get results" });
  }
};

// Get user's last attempted quiz
export const getLastAttemptedQuiz = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Find the user's most recent submission
    const lastSubmission = await prisma.submission.findFirst({
      where: {
        participant: {
          userId: req.user.id,
        },
      },
      include: {
        quiz: {
          include: {
            questions: true,
            _count: {
              select: {
                submissions: true,
              },
            },
          },
        },
        participant: true,
      },
      orderBy: {
        submittedAt: "desc",
      },
    });

    if (!lastSubmission) {
      return res.status(404).json({ message: "No attempted quizzes found" });
    }

    const quiz = lastSubmission.quiz;
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage =
      totalPoints > 0
        ? Math.round((lastSubmission.score / totalPoints) * 100)
        : 0;
    const deadlinePassed =
      !quiz.deadline || new Date(quiz.deadline) <= new Date();

    // Parse answers
    const answers =
      typeof lastSubmission.answers === "string"
        ? JSON.parse(lastSubmission.answers)
        : lastSubmission.answers;

    // Calculate detailed results per question
    const questionResults = quiz.questions.map((question) => {
      const userAnswer = answers[question.id];
      let isCorrect = false;

      if (
        question.type === "single-choice" ||
        question.type === "multiple-choice"
      ) {
        isCorrect = question.answer === userAnswer;
      } else if (question.type === "multi-choice") {
        const correctAnswers = Array.isArray(question.answer)
          ? question.answer
          : [];
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
        isCorrect =
          correctAnswers.length === userAnswers.length &&
          correctAnswers.every((ans) => userAnswers.includes(ans));
      } else {
        isCorrect =
          String(question.answer).toLowerCase() ===
          String(userAnswer).toLowerCase();
      }

      return {
        id: question.id,
        content: question.content,
        type: question.type,
        choices: question.choices,
        correctAnswer: deadlinePassed ? question.answer : null,
        userAnswer,
        isCorrect,
        points: question.points,
        earnedPoints: isCorrect ? question.points : 0,
      };
    });

    res.json({
      quiz: {
        id: quiz.id,
        name: quiz.title,
        code: quiz.code,
        deadline: quiz.deadline,
        totalQuestions: quiz.questions.length,
        totalParticipants: quiz._count.submissions,
        deadlinePassed,
      },
      submission: {
        id: lastSubmission.id,
        submittedAt: lastSubmission.submittedAt,
        rawScore: lastSubmission.score,
        totalPoints,
        percentage,
        rank: null, // Will calculate if needed
      },
      questionResults,
      participant: {
        name: lastSubmission.participant.name,
      },
    });
  } catch (error) {
    console.error("Get last attempted quiz error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Get guest quiz results by quiz code and participant name
export const getGuestQuizResults = async (req, res) => {
  try {
    const { code, participantName } = req.body;

    if (!code || !participantName) {
      return res.status(400).json({
        message: "Quiz code and participant name are required",
      });
    }

    // Find the quiz
    const quiz = await prisma.quiz.findUnique({
      where: { code },
      include: {
        questions: true,
        _count: {
          select: {
            submissions: true,
          },
        },
      },
    });

    if (!quiz) {
      return res.status(404).json({ message: "Quiz not found" });
    }

    // Check if deadline has passed
    const deadlinePassed =
      !quiz.deadline || new Date(quiz.deadline) <= new Date();

    if (!deadlinePassed) {
      return res.status(403).json({
        message: "Results not available until deadline passes",
        deadline: quiz.deadline,
      });
    }

    // Find participant by name and quiz
    const participant = await prisma.participant.findFirst({
      where: {
        quizId: quiz.id,
        username: participantName,
      },
      include: {
        submissions: {
          orderBy: {
            submittedAt: "desc",
          },
          take: 1,
        },
      },
    });

    if (!participant) {
      return res.status(404).json({
        message: "No quiz attempt found for this participant name",
      });
    }

    if (!participant.submissions || participant.submissions.length === 0) {
      return res.status(404).json({
        message: "No submission found for this participant",
      });
    }

    const submission = participant.submissions[0];
    const totalPoints = quiz.questions.reduce((sum, q) => sum + q.points, 0);
    const percentage =
      totalPoints > 0 ? Math.round((submission.score / totalPoints) * 100) : 0;

    // Parse answers
    const answers =
      typeof submission.answers === "string"
        ? JSON.parse(submission.answers)
        : submission.answers;

    // Calculate detailed results per question
    const questionResults = quiz.questions.map((question) => {
      const userAnswer = answers[question.id];
      let isCorrect = false;

      if (
        question.type === "single-choice" ||
        question.type === "multiple-choice"
      ) {
        isCorrect = question.answer === userAnswer;
      } else if (question.type === "multi-choice") {
        const correctAnswers = Array.isArray(question.answer)
          ? question.answer
          : [];
        const userAnswers = Array.isArray(userAnswer) ? userAnswer : [];
        isCorrect =
          correctAnswers.length === userAnswers.length &&
          correctAnswers.every((ans) => userAnswers.includes(ans));
      } else {
        isCorrect =
          String(question.answer).toLowerCase() ===
          String(userAnswer).toLowerCase();
      }

      return {
        id: question.id,
        content: question.content,
        type: question.type,
        choices: question.choices,
        correctAnswer: question.answer,
        userAnswer,
        isCorrect,
        points: question.points,
        earnedPoints: isCorrect ? question.points : 0,
      };
    });

    // Get participant ranking
    const allSubmissions = await prisma.submission.findMany({
      where: { quizId: quiz.id },
      orderBy: [{ score: "desc" }, { submittedAt: "asc" }],
    });

    const rank =
      allSubmissions.findIndex((sub) => sub.id === submission.id) + 1;

    res.json({
      quiz: {
        id: quiz.id,
        name: quiz.title,
        code: quiz.code,
        deadline: quiz.deadline,
        totalQuestions: quiz.questions.length,
        totalParticipants: quiz._count.submissions,
        deadlinePassed: true,
      },
      submission: {
        id: submission.id,
        submittedAt: submission.submittedAt,
        rawScore: submission.score,
        totalPoints,
        percentage,
        rank,
      },
      questionResults,
      participant: {
        name: participant.username,
      },
    });
  } catch (error) {
    console.error("Get guest quiz results error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
