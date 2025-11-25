import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Add question
export const addQuestion = async (req, res) => {
  const { code } = req.params;
  const { content, type, choices, answer, points = 1, order = 0 } = req.body;
  const quiz = await prisma.quiz.findUnique({ where: { code } });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  // admin check
  if (quiz.adminId && req.user?.id !== quiz.adminId)
    return res.status(403).json({ message: "Not authorized" });

  const q = await prisma.question.create({
    data: { quizId: quiz.id, content, type, choices, answer, points, order },
  });
  res.json({ question: q });
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
