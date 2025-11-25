import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Participant join - with or without login
export const joinQuiz = async (req, res) => {
  const { code } = req.params;
  const { username } = req.body;

  const quiz = await prisma.quiz.findUnique({ where: { code } });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  if (!quiz.active) return res.status(400).json({ message: "Quiz not active" });

  // If user is logged in, link their account
  const data = {
    quizId: quiz.id,
    username: username || req.user?.name || "Anonymous",
  };

  if (req.user) {
    data.userId = req.user.id;
  }

  const participant = await prisma.participant.create({ data });
  res.json({ participant });
};
