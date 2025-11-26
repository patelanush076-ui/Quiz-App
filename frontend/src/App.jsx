import React, { useState, useEffect } from "react";
import CreateRoom from "./components/CreateRoom";
import JoinRoom from "./components/JoinRoom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Room from "./components/Room";
import Quiz from "./components/Quiz";
import QuizTaker from "./components/QuizTaker";
import QuizBuilder from "./components/QuizBuilder";
import QuizDashboard from "./components/QuizDashboard";
import RecentQuizzes from "./components/RecentQuizzes";
import LastAttemptedQuiz from "./components/LastAttemptedQuiz";
import QuizResultsView from "./components/QuizResultsView";
import GuestResultsLookup from "./components/GuestResultsLookup";
import AIQuizGenerator from "./components/AIQuizGenerator";
import AIQuizPreview from "./components/AIQuizPreview";
import authService from "./lib/authService";

function App() {
  const [view, setView] = useState("home"); // 'home' | 'create' | 'join' | 'room' | 'login' | 'signup' | 'quiz-taker' | 'result' | 'quiz-builder' | 'quiz-dashboard' | 'quiz-results' | 'guest-results' | 'ai-quiz-generator' | 'ai-quiz-preview'
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentName, setCurrentName] = useState(null);
  const [currentParticipantId, setCurrentParticipantId] = useState(null);
  const [initialJoinCode, setInitialJoinCode] = useState("");
  const [initialJoinName, setInitialJoinName] = useState("");
  const [lastAttemptedQuiz, setLastAttemptedQuiz] = useState(null);
  const [user, setUser] = useState(null);
  const [quizResult, setQuizResult] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [aiQuizData, setAiQuizData] = useState(null);

  function handleCreated(room, participantId) {
    setCurrentRoom(room);
    setCurrentName(room.host);
    setCurrentParticipantId(participantId || null);
    setView("room");
    try {
      window.history.replaceState(
        null,
        "",
        `?code=${room.code}&name=${room.host}`
      );
    } catch (e) {
      /* ignore */
    }
  }

  function handleJoined(room, name, participantId) {
    setCurrentRoom(room);
    setCurrentName(name);
    setCurrentParticipantId(participantId || null);
    // also persist participantId locally for retry
    try {
      localStorage.setItem("participantId", participantId || "");
    } catch (e) {}
    // Direct to quiz-taker view after joining
    setView("quiz-taker");
    try {
      window.history.replaceState(null, "", `?code=${room.code}&name=${name}`);
    } catch (e) {
      /* ignore */
    }
  }

  function handleQuizSubmitted(result) {
    setQuizResult(result);
    setView("result");
  }

  function backToHome() {
    goHome();
    setQuizResult(null);
  }

  function handleLogin(user) {
    setUser(user);
    setView("home");
  }

  async function handleLogout() {
    try {
      await authService.logout();
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      setUser(null);
      setView("home");
    }
  }

  function handleQuizCreated(quiz) {
    setCurrentQuiz(quiz);
    setView("quiz-dashboard");
  }

  function goHome() {
    setView("home");
    setCurrentRoom(null);
    setCurrentName(null);
    setCurrentQuiz(null);
    setQuizResult(null);
    setAiQuizData(null);
  }

  function handleAIQuizGenerated(quizData) {
    setAiQuizData(quizData);
    setView("ai-quiz-preview");
  }

  function handleAIQuizAccepted(finalQuizData) {
    // Convert AI quiz data to QuizBuilder format
    const quizBuilderData = {
      title: finalQuizData.title,
      adminName: user.name,
      deadline: "",
      questions: finalQuizData.questions.map((q) => ({
        content: q.content,
        type: q.type,
        choices: q.choices,
        correctAnswer: q.choices.indexOf(q.correctAnswer),
        points: q.points || 1,
      })),
    };

    setCurrentQuiz(quizBuilderData);
    setView("quiz-builder");
  }

  useEffect(() => {
    // load user from localStorage if present
    const u = authService.getUser();
    if (u) setUser(u);
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get("code");
    const nameParam = params.get("name");
    if (codeParam) {
      setInitialJoinCode(codeParam.toUpperCase());
      if (nameParam) setInitialJoinName(nameParam);
      setView("join");
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Quiz App</h1>
          <nav className="space-x-2">
            <button
              className="px-3 py-1 rounded bg-slate-700"
              onClick={() => setView("home")}
            >
              Home
            </button>
            {user ? (
              <>
                <span className="px-3 py-1 rounded bg-slate-700">
                  {user.name}
                </span>
                <button
                  className="px-3 py-1 rounded bg-red-600"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  className="px-3 py-1 rounded bg-slate-700"
                  onClick={() => setView("login")}
                >
                  Login
                </button>
                <button
                  className="px-3 py-1 rounded bg-rose-600"
                  onClick={() => setView("signup")}
                >
                  Sign up
                </button>
              </>
            )}
            <button
              className="px-3 py-1 rounded bg-indigo-600"
              onClick={() =>
                user ? setView("quiz-builder") : setView("login")
              }
            >
              {user ? "Create Quiz" : "Create"}
            </button>
            <button
              className="px-3 py-1 rounded bg-green-600"
              onClick={() => setView("join")}
            >
              Join
            </button>
          </nav>
        </header>

        <main>
          {view === "home" && (
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-semibold">Welcome to Quiz App</h2>
              <p className="text-gray-300">
                {user
                  ? `Hello ${user.name}! Create engaging quizzes with deadlines and questions, or join existing quizzes.`
                  : "Create engaging quizzes with deadlines, share them with participants, and view results after completion."}
              </p>
              <div className="flex justify-center gap-3 flex-wrap">
                {user ? (
                  <>
                    <button
                      onClick={() => setView("quiz-builder")}
                      className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-lg"
                    >
                      Create New Quiz
                    </button>
                    <button
                      onClick={() => setView("ai-quiz-generator")}
                      className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 rounded-lg font-medium text-lg flex items-center gap-2"
                    >
                      🤖 Create with AI
                    </button>
                    <button
                      onClick={() => setView("join")}
                      className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-lg"
                    >
                      Join Quiz
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setView("login")}
                      className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium text-lg"
                    >
                      Login to Create Quiz
                    </button>
                    <button
                      onClick={() => setView("join")}
                      className="px-8 py-4 bg-green-600 hover:bg-green-700 rounded-lg font-medium text-lg"
                    >
                      Join Quiz
                    </button>
                    <button
                      onClick={() => setView("guest-results")}
                      className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium text-lg"
                    >
                      Check My Results
                    </button>
                  </>
                )}
              </div>

              {user && (
                <div className="mt-12 max-w-6xl mx-auto space-y-12">
                  <LastAttemptedQuiz
                    onViewResults={(quizData) => {
                      setLastAttemptedQuiz(quizData);
                      setView("quiz-results");
                    }}
                    onViewAnalytics={(quizData) => {
                      setCurrentQuiz(quizData.quiz);
                      setView("quiz-dashboard");
                    }}
                  />

                  <RecentQuizzes
                    onViewDashboard={(quiz) => {
                      setCurrentQuiz(quiz);
                      setView("quiz-dashboard");
                    }}
                    onViewAnalytics={(quiz) => {
                      setCurrentQuiz(quiz);
                      setView("quiz-dashboard");
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {view === "create" && (
            <CreateRoom
              user={user}
              onCreated={handleCreated}
              onNeedLogin={(action) => setView(action)}
            />
          )}

          {view === "join" && (
            <JoinRoom
              user={user}
              onJoined={handleJoined}
              initialCode={initialJoinCode}
              initialName={initialJoinName}
            />
          )}

          {view === "login" && <Login onLoggedIn={handleLogin} />}
          {view === "signup" && <Signup onSignedUp={handleLogin} />}

          {view === "room" && currentRoom && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <h2 className="text-xl font-medium">Room {currentRoom.code}</h2>
                <div>
                  <button
                    className="px-3 py-1 rounded bg-slate-700 mr-2"
                    onClick={goHome}
                  >
                    Leave
                  </button>
                </div>
              </div>
              <Room
                code={currentRoom.code}
                yourName={currentName}
                isHost={currentName === currentRoom.host}
                onStart={() => setView("quiz")}
                participantId={currentParticipantId}
              />
            </div>
          )}
          {view === "quiz" && currentRoom && (
            <div>
              <Quiz
                code={currentRoom.code}
                participantId={currentParticipantId}
                onFinished={() => setView("room")}
              />
            </div>
          )}

          {view === "quiz-taker" && currentRoom && currentParticipantId && (
            <QuizTaker
              code={currentRoom.code}
              participantId={currentParticipantId}
              onSubmitted={handleQuizSubmitted}
              onCancel={backToHome}
            />
          )}

          {view === "result" && quizResult && (
            <div className="max-w-2xl mx-auto p-6 rounded bg-white/5">
              <div className="text-center">
                <h2 className="text-3xl font-bold mb-4">Quiz Submitted!</h2>
                <p className="text-2xl text-emerald-400 mb-6">
                  Your Score: {quizResult.score}
                </p>
                <div className="bg-slate-800 p-4 rounded mb-6 text-left">
                  <h3 className="font-semibold mb-3">Results:</h3>
                  <pre className="text-sm overflow-auto max-h-64">
                    {JSON.stringify(quizResult.detail, null, 2)}
                  </pre>
                </div>
                <button
                  onClick={backToHome}
                  className="px-6 py-2 rounded bg-indigo-600 hover:bg-indigo-700"
                >
                  Back to Home
                </button>
              </div>
            </div>
          )}

          {view === "quiz-builder" && (
            <QuizBuilder
              user={user}
              onQuizCreated={handleQuizCreated}
              onCancel={goHome}
              initialQuiz={currentQuiz}
            />
          )}

          {view === "ai-quiz-generator" && (
            <AIQuizGenerator
              onQuizGenerated={handleAIQuizGenerated}
              onCancel={goHome}
            />
          )}

          {view === "ai-quiz-preview" && aiQuizData && (
            <AIQuizPreview
              aiQuizData={aiQuizData}
              onAccept={handleAIQuizAccepted}
              onRegenerate={() => setView("ai-quiz-generator")}
              onCancel={goHome}
            />
          )}

          {view === "quiz-dashboard" && currentQuiz && (
            <QuizDashboard quiz={currentQuiz} user={user} onBack={goHome} />
          )}

          {view === "quiz-results" && lastAttemptedQuiz && (
            <QuizResultsView
              quizData={lastAttemptedQuiz}
              onBack={() => {
                setLastAttemptedQuiz(null);
                setView("home");
              }}
            />
          )}

          {view === "guest-results" && (
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <button
                  onClick={() => setView("home")}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-white"
                >
                  ← Back to Home
                </button>
              </div>

              <GuestResultsLookup
                onViewResults={(quizData) => {
                  setLastAttemptedQuiz(quizData);
                  setView("quiz-results");
                }}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
