// API helper to consistently include Authorization header
import { getToken } from "./authService";

const API_BASE = "http://localhost:4000";

function getHeaders(includeAuth = true) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

export async function apiFetch(endpoint, options = {}) {
  const { method = "GET", body = null, includeAuth = true, ...rest } = options;

  const fetchOptions = {
    method,
    headers: getHeaders(includeAuth),
    ...rest,
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, fetchOptions);
  return response;
}

export async function getUserQuizzes() {
  try {
    const response = await apiFetch("/api/user/quizzes");
    if (response.ok) {
      return await response.json();
    }
    throw new Error("Failed to fetch quizzes");
  } catch (error) {
    console.error("Error fetching user quizzes:", error);
    throw error;
  }
}

export async function getLastAttemptedQuiz() {
  try {
    const response = await apiFetch("/api/user/last-attempted");
    if (response.ok) {
      return await response.json();
    }
    throw new Error("Failed to fetch last attempted quiz");
  } catch (error) {
    console.error("Error fetching last attempted quiz:", error);
    throw error;
  }
}

export async function getGuestQuizResults(quizCode, participantName) {
  try {
    const response = await apiFetch("/api/guest/quiz-results", {
      method: "POST",
      body: {
        code: quizCode,
        participantName: participantName,
      },
      includeAuth: false,
    });
    if (response.ok) {
      return await response.json();
    }
    const errorData = await response.json();
    throw new Error(errorData.message || "Failed to fetch guest quiz results");
  } catch (error) {
    console.error("Error fetching guest quiz results:", error);
    throw error;
  }
}

export default {
  apiFetch,
  getHeaders,
  getUserQuizzes,
  getLastAttemptedQuiz,
  getGuestQuizResults,
};
