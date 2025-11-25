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
  try {
    const { title, adminName, deadline } = req.body;

    // Validation
    if (!title || title.trim().length < 3) {
      return res
        .status(400)
        .json({ message: "Title must be at least 3 characters long" });
    }

    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Authentication required to create quiz" });
    }

    let code;
    let exists = true;
    do {
      code = generateCode();
      const q = await prisma.quiz.findUnique({ where: { code } });
      exists = !!q;
    } while (exists);

    const data = {
      title: title.trim(),
      adminName: adminName || req.user.name,
      code,
      adminId: req.user.id,
    };

    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (deadlineDate > new Date()) {
        data.deadline = deadlineDate;
      }
    }

    const quiz = await prisma.quiz.create({
      data,
    });
    res.json({ quiz });
  } catch (error) {
    console.error("Create quiz error:", error);
    res.status(500).json({ message: "Failed to create quiz" });
  }
};

// Get quiz (public) - don't include canonical answers
export const getQuiz = async (req, res) => {
  try {
    const { code } = req.params;
    const quiz = await prisma.quiz.findUnique({
      where: { code },
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        participants: true,
      },
    });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // For admin users, include answers; for others, remove them
    const isAdmin = req.user && req.user.id === quiz.adminId;

    const questions = quiz.questions.map((q) => {
      const questionData = {
        id: q.id,
        order: q.order,
        content: q.content,
        type: q.type,
        choices: q.choices,
        points: q.points,
      };

      // Include answers only for admin
      if (isAdmin) {
        questionData.answer = q.answer;
      }

      return questionData;
    });

    res.json({
      quiz: {
        id: quiz.id,
        code: quiz.code,
        title: quiz.title,
        adminName: quiz.adminName,
        adminId: quiz.adminId,
        active: quiz.active,
        deadline: quiz.deadline,
        started: quiz.started,
        participants: quiz.participants.map((p) => p.username),
        questions: questions,
      },
    });
  } catch (error) {
    console.error("Get quiz error:", error);
    res.status(500).json({ message: "Failed to get quiz" });
  }
};

// Update quiz fields
export const updateQuiz = async (req, res) => {
  try {
    const { code } = req.params;
    const { title, deadline, active } = req.body;

    const quiz = await prisma.quiz.findUnique({ where: { code } });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check if user is the admin of this quiz
    if (!req.user || req.user.id !== quiz.adminId) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this quiz" });
    }

    const updateData = {};

    if (title !== undefined && title.trim().length >= 3) {
      updateData.title = title.trim();
    }

    if (deadline !== undefined) {
      if (deadline === null || deadline === "") {
        updateData.deadline = null;
      } else {
        const deadlineDate = new Date(deadline);
        if (isNaN(deadlineDate.getTime())) {
          return res.status(400).json({ message: "Invalid deadline format" });
        }
        updateData.deadline = deadlineDate;
      }
    }

    if (active !== undefined) {
      updateData.active = active;
    }

    // Prevent empty updates
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }

    const updated = await prisma.quiz.update({
      where: { id: quiz.id },
      data: updateData,
      include: {
        questions: {
          orderBy: { order: "asc" },
        },
        participants: true,
      },
    });

    // Return updated quiz in same format as getQuiz
    res.json({
      quiz: {
        id: updated.id,
        code: updated.code,
        title: updated.title,
        adminName: updated.adminName,
        adminId: updated.adminId,
        active: updated.active,
        deadline: updated.deadline,
        started: updated.started,
        participants: updated.participants.map((p) => p.username),
        questions: updated.questions.map((q) => ({
          id: q.id,
          order: q.order,
          content: q.content,
          type: q.type,
          choices: q.choices,
          points: q.points,
          answer: q.answer, // Include answers for admin
        })),
      },
    });
  } catch (error) {
    console.error("Update quiz error:", error);
    res.status(500).json({ message: "Failed to update quiz" });
  }
};

// Start quiz (set started=true)
export const startQuiz = async (req, res) => {
  try {
    const { code } = req.params;
    const quiz = await prisma.quiz.findUnique({ where: { code } });
    if (!quiz) return res.status(404).json({ message: "Quiz not found" });

    // Check if user is the admin of this quiz
    if (!req.user || req.user.id !== quiz.adminId) {
      return res
        .status(403)
        .json({ message: "Not authorized to start this quiz" });
    }

    const updated = await prisma.quiz.update({
      where: { id: quiz.id },
      data: { started: true, active: true },
    });
    res.json({ quiz: updated });
  } catch (error) {
    console.error("Start quiz error:", error);
    res.status(500).json({ message: "Failed to start quiz" });
  }
};

// Get user's recent quizzes
export const getUserQuizzes = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: "Authentication required to get quizzes" });
    }

    const quizzes = await prisma.quiz.findMany({
      where: { adminId: req.user.id },
      include: {
        _count: {
          select: {
            submissions: true,
            questions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5, // Get last 5 quizzes
    });

    const formattedQuizzes = quizzes.map((quiz) => ({
      id: quiz.id,
      title: quiz.title,
      name: quiz.title,
      code: quiz.code,
      adminId: quiz.adminId,
      deadline: quiz.deadline,
      createdAt: quiz.createdAt,
      participantCount: quiz._count.submissions,
      questionCount: quiz._count.questions,
      status: new Date() > new Date(quiz.deadline) ? "completed" : "active",
    }));

    res.json(formattedQuizzes);
  } catch (error) {
    console.error("Get user quizzes error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
