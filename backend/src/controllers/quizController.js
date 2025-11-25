import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateCode(length = 6) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Create quiz
export const createQuiz = async (req, res) => {
  const { title, adminName } = req.body;
  let code;
  let exists = true;
  do {
    code = generateCode();
    const q = await prisma.quiz.findUnique({ where: { code } });
    exists = !!q;
  } while (exists);

  const data = { title, adminName, code };
  if (req.user) data.adminId = req.user.id;
  const quiz = await prisma.quiz.create({
    data,
  });
  res.json({ quiz });
};

// Get quiz (public) - don't include canonical answers
export const getQuiz = async (req, res) => {
  const { code } = req.params;
  const quiz = await prisma.quiz.findUnique({
    where: { code },
    include: { questions: true, participants: true },
  });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  // remove answers from questions in public view
  const publicQuestions = quiz.questions.map((q) => ({
    id: q.id,
    order: q.order,
    content: q.content,
    type: q.type,
    choices: q.choices,
    points: q.points,
  }));

  res.json({
    quiz: {
      id: quiz.id,
      code: quiz.code,
      title: quiz.title,
      adminName: quiz.adminName,
      active: quiz.active,
      deadline: quiz.deadline,
      started: quiz.started,
      participants: quiz.participants.map((p) => p.username),
      questions: publicQuestions,
    },
  });
};

// Update quiz fields
export const updateQuiz = async (req, res) => {
  const { code } = req.params;
  const { title, deadline, active } = req.body;
  const quiz = await prisma.quiz.findUnique({ where: { code } });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  const updated = await prisma.quiz.update({
    where: { id: quiz.id },
    data: {
      title: title ?? undefined,
      deadline: deadline ? new Date(deadline) : undefined,
      active: active ?? undefined,
    },
  });
  res.json({ quiz: updated });
};

// Start quiz (set started=true)
export const startQuiz = async (req, res) => {
  const { code } = req.params;
  const quiz = await prisma.quiz.findUnique({ where: { code } });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });
  const updated = await prisma.quiz.update({
    where: { id: quiz.id },
    data: { started: true },
  });
  res.json({ quiz: updated });
};
