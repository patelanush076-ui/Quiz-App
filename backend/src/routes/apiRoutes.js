import express from "express";
import {
  createQuiz,
  getQuiz,
  updateQuiz,
  startQuiz,
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
} from "../controllers/submissionController.js";

const router = express.Router();

// Quiz routes
router.post("/quizzes", createQuiz);
router.get("/quizzes/:code", getQuiz);
router.patch("/quizzes/:code", updateQuiz);
router.post("/quizzes/:code/start", startQuiz);

// Question routes
router.post("/quizzes/:code/questions", addQuestion);
router.patch("/quizzes/:code/questions/:qid", editQuestion);
router.delete("/quizzes/:code/questions/:qid", deleteQuestion);

// Participant routes
router.post("/quizzes/:code/join", joinQuiz);

// Submission routes
router.post("/quizzes/:code/submit", submitAnswers);
router.get("/quizzes/:code/result", getResults);

export default router;
