import React, { useState, useEffect } from "react";
import CreateRoom from "./components/CreateRoom";
import JoinRoom from "./components/JoinRoom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Room from "./components/Room";
import Quiz from "./components/Quiz";
import authService from "./lib/authService";

function App() {
  const [view, setView] = useState("home"); // 'home' | 'create' | 'join' | 'room' | 'login' | 'signup'
  const [currentRoom, setCurrentRoom] = useState(null);
  const [currentName, setCurrentName] = useState(null);
  const [currentParticipantId, setCurrentParticipantId] = useState(null);
  const [initialJoinCode, setInitialJoinCode] = useState("");
  const [initialJoinName, setInitialJoinName] = useState("");
  const [user, setUser] = useState(null);

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
    setView("room");
    try {
      window.history.replaceState(null, "", `?code=${room.code}&name=${name}`);
    } catch (e) {
      /* ignore */
    }
  }

  function handleLogin(user) {
    setUser(user);
    setView("home");
  }

  function handleLogout() {
    setUser(null);
    authService.logout();
  }

  function goHome() {
    setView("home");
    setCurrentRoom(null);
    setCurrentName(null);
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
                <span className="px-3 py-1 rounded bg-slate-700">{user.name}</span>
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
              onClick={() => setView("create")}
            >
              Create
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
              <h2 className="text-3xl font-semibold">
                Create or Join a Quiz Room
              </h2>
              <p className="text-gray-300">
                Create a room and share the code with others to join.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => setView("create")}
                  className="px-6 py-3 bg-indigo-600 rounded"
                >
                  Create Room
                </button>
                <button
                  onClick={() => setView("join")}
                  className="px-6 py-3 bg-green-600 rounded"
                >
                  Join Room
                </button>
              </div>
            </div>
          )}

          {view === "create" && (
            <CreateRoom user={user} onCreated={handleCreated} />
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
        </main>
      </div>
    </div>
  );
}

export default App;
