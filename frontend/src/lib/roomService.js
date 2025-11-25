// Mock room service using localStorage to emulate backend behavior.
// This is a simple implementation for development/demo-only.

function _getRooms() {
  try {
    const raw = localStorage.getItem("quiz_rooms");
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Failed to read rooms from localStorage", e);
    return {};
  }
}

function _saveRooms(rooms) {
  try {
    localStorage.setItem("quiz_rooms", JSON.stringify(rooms));
  } catch (e) {
    console.warn("Failed to save rooms to localStorage", e);
  }
}

function _generateCode(length = 6) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createRoom({ hostName = "Host", title = "Quiz" } = {}) {
  // Try backend first
  try {
    const token = localStorage.getItem("jwt");
    const res = await fetch("http://localhost:4000/api/quizzes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ title, adminName: hostName }),
    });
    if (res.ok) {
      const json = await res.json();
      const q = json.quiz;
      return {
        code: q.code,
        title: q.title,
        host: q.adminName,
        participants: [],
        started: q.started,
      };
    }
  } catch (e) {
    /* fallback to local storage */
  }

  const rooms = _getRooms();
  let code;
  do {
    code = _generateCode();
  } while (rooms[code]);

  const room = {
    code,
    title,
    host: hostName,
    participants: [hostName],
    started: false,
    createdAt: Date.now(),
  };
  rooms[code] = room;
  _saveRooms(rooms);
  return room;
}

export async function joinRoom(
  code,
  participantName = "Player",
  options = { useToken: true }
) {
  try {
    const token = options.useToken ? localStorage.getItem("jwt") : null;
    const res = await fetch(`http://localhost:4000/api/quizzes/${code}/join`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ username: participantName }),
    });
    const json = await res.json();
    if (res.ok) {
      // return room data from backend to keep consistent API
      const roomRes = await fetch(`http://localhost:4000/api/quizzes/${code}`);
      if (roomRes.ok) {
        const rjson = await roomRes.json();
        // map to local format
        const quiz = rjson.quiz;
        return {
          room: {
            code: quiz.code,
            title: quiz.title,
            host: quiz.adminName,
            participants: [],
            started: quiz.started,
          },
          participantId: json.participant ? json.participant.id : undefined,
        };
      }
      return {
        room: { code },
        participantId: json.participant ? json.participant.id : undefined,
      };
    }
    throw new Error(json.message || "Failed to join");
  } catch (e) {
    /* fallback */
  }

  const rooms = _getRooms();
  const room = rooms[code];
  if (!room) throw new Error("Room not found");
  if (!room.participants.includes(participantName)) {
    room.participants.push(participantName);
    rooms[code] = room;
    _saveRooms(rooms);
  }
  // for local fallback, generate a pseudo participantId
  const participantId = "local-" + Math.random().toString(36).slice(2, 10);
  return { room, participantId };
}

export async function getRoom(code) {
  try {
    const token = localStorage.getItem("jwt");
    const res = await fetch(`http://localhost:4000/api/quizzes/${code}`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const json = await res.json();
    if (res.ok) {
      const q = json.quiz;
      return {
        code: q.code,
        title: q.title,
        host: q.adminName,
        participants: q.participants || [],
        started: q.started,
        questions: q.questions,
      };
    }
  } catch (e) {
    /* fallback */
  }

  const rooms = _getRooms();
  return rooms[code] || null;
}

export async function startRoom(code) {
  try {
    const res = await fetch(`http://localhost:4000/api/quizzes/${code}/start`, {
      method: "POST",
    });
    const json = await res.json();
    if (res.ok) {
      const q = json.quiz;
      return {
        code: q.code,
        title: q.title,
        host: q.adminName,
        participants: [],
        started: q.started,
      };
    }
  } catch (e) {
    /* fallback */
  }

  const rooms = _getRooms();
  const room = rooms[code];
  if (!room) throw new Error("Room not found");
  room.started = true;
  rooms[code] = room;
  _saveRooms(rooms);
  return room;
}
export default { createRoom, joinRoom, getRoom, startRoom };
