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
    const got = answers[q.id];
    if (!got) {
      detail[q.id] = { earned: 0, correct: false };
      continue;
    }

    if (q.type === "single-choice") {
      const correct =
        q.answer &&
        (q.answer === got ||
          (Array.isArray(q.answer) && q.answer.includes(got)));
      const earned = correct ? q.points : 0;
      detail[q.id] = { earned, correct };
      total += earned;
    } else if (q.type === "multi-choice") {
      // basic partial scoring: count correct options matched
      const corr = Array.isArray(q.answer) ? q.answer : [];
      const matches = Array.isArray(got)
        ? got.filter((x) => corr.includes(x)).length
        : 0;
      const partial = Math.round((matches / corr.length) * q.points);
      detail[q.id] = { earned: partial, correct: matches === corr.length };
      total += partial;
    } else {
      // text: exact match
      const correct =
        q.answer &&
        String(q.answer).toLowerCase() === String(got).toLowerCase();
      const earned = correct ? q.points : 0;
      detail[q.id] = { earned, correct };
      total += earned;
    }
  }

  const submission = await prisma.submission.create({
    data: { participantId, quizId: quiz.id, answers, score: total },
  });
  res.json({ submission, score: total, detail });
};

// Get result for participant
export const getResults = async (req, res) => {
  const { code } = req.params;
  const { participantId } = req.query;
  const quiz = await prisma.quiz.findUnique({
    where: { code },
    include: { submissions: true },
  });
  if (!quiz) return res.status(404).json({ message: "Quiz not found" });

  // if deadline is present and not reached, disallow
  if (quiz.deadline && new Date(quiz.deadline) > new Date()) {
    return res
      .status(403)
      .json({ message: "Results not available until deadline passes" });
  }

  const subs = await prisma.submission.findMany({ where: { quizId: quiz.id } });
  // compute rank
  subs.sort(
    (a, b) =>
      b.score - a.score || new Date(a.submittedAt) - new Date(b.submittedAt)
  );
  const rank = subs.map((s, i) => ({
    id: s.id,
    participantId: s.participantId,
    score: s.score,
    rank: i + 1,
  }));
  const my = rank.find((r) => r.participantId === participantId);
  res.json({ rank, me: my });
};
