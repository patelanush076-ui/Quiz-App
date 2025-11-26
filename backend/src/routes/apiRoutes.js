import express from "express";
import {
  createQuiz,
  getQuiz,
  updateQuiz,
  startQuiz,
  getUserQuizzes,
} from "../controllers/quizController.js";
import {
  addQuestion,
  editQuestion,
  deleteQuestion,
} from "../controllers/questionController.js";
import { joinQuiz } from "../controllers/participantController.js";
import {
  submitAnswers,
  getResults,
  getLastAttemptedQuiz,
  getGuestQuizResults,
} from "../controllers/submissionController.js";
import { generateQuizWithAI } from "../controllers/aiController.js";

const router = express.Router();

// Middleware to require authentication
function requireAuth(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
}

// Quiz routes
router.post("/quizzes", requireAuth, createQuiz); // Only logged-in users can create
router.get("/quizzes/:code", getQuiz); // Anyone can view quiz details
router.patch("/quizzes/:code", requireAuth, updateQuiz); // Only quiz owner can update
router.post("/quizzes/:code/start", requireAuth, startQuiz); // Only quiz owner can start
router.get("/user/quizzes", requireAuth, getUserQuizzes); // Get user's recent quizzes

// AI routes
router.post("/ai/generate-quiz", requireAuth, generateQuizWithAI); // Generate quiz with AI

// Question routes (only quiz owners)
router.post("/quizzes/:code/questions", requireAuth, addQuestion);
router.patch("/quizzes/:code/questions/:qid", requireAuth, editQuestion);
router.delete("/quizzes/:code/questions/:qid", requireAuth, deleteQuestion);

// Participant routes
router.post("/quizzes/:code/join", joinQuiz); // Anyone can join (with or without auth)

// Submission routes
router.post("/quizzes/:code/submit", submitAnswers); // Anyone can submit (participant-based)
router.get("/quizzes/:code/result", getResults); // Anyone can view results
router.get("/user/last-attempted", requireAuth, getLastAttemptedQuiz); // Get user's last attempted quiz
router.post("/guest/quiz-results", getGuestQuizResults); // Get guest quiz results by code + name

export default router;
