import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Add question
export const addQuestion = async (req, res) => {
  try {
    const { code } = req.params;
    const { content, type, choices, answer, points = 1, order = 0 } = req.body;

    // Validation
    if (!content || content.trim().length < 5) {
      return res
        .status(400)
        .json({ message: "Question content must be at least 5 characters" });
    }

    const quiz = await prisma.quiz.findUnique({ where: { code } });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Admin check
    if (!req.user || req.user.id !== quiz.adminId) {
      return res
        .status(403)
        .json({ message: "Not authorized to add questions" });
    }

    // Auto-increment order if not provided
    let questionOrder = order;
    if (order === 0) {
      const maxOrder = await prisma.question.findFirst({
        where: { quizId: quiz.id },
        orderBy: { order: "desc" },
        select: { order: true },
      });
      questionOrder = (maxOrder?.order || 0) + 1;
    }

    const q = await prisma.question.create({
      data: {
        quizId: quiz.id,
        content: content.trim(),
        type,
        choices,
        answer,
        points: Math.max(1, points),
        order: questionOrder,
      },
    });
    res.json({ question: q });
  } catch (error) {
    console.error("Add question error:", error);
    res.status(500).json({ message: "Failed to add question" });
  }
};

// Edit question
export const editQuestion = async (req, res) => {
  const { code, qid } = req.params;
  const { content, type, choices, answer, points, order } = req.body;
  const quiz = await prisma.quiz.findUnique({ where: { code } });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  const q = await prisma.question.update({
    where: { id: qid },
    data: { content, type, choices, answer, points, order },
  });
  res.json({ question: q });
};

// Delete question
export const deleteQuestion = async (req, res) => {
  const { code, qid } = req.params;
  const quiz = await prisma.quiz.findUnique({ where: { code } });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  await prisma.question.delete({ where: { id: qid } });
  res.json({ ok: true });
};
