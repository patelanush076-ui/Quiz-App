// Input validation utilities

export function validateUsername(username) {
  const errors = [];

  if (!username || typeof username !== "string") {
    errors.push("Username is required");
    return errors;
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    errors.push("Username must be at least 3 characters long");
  }

  if (trimmed.length > 50) {
    errors.push("Username must be less than 50 characters");
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    errors.push(
      "Username can only contain letters, numbers, hyphens, and underscores"
    );
  }

  return errors;
}

export function validatePassword(password) {
  const errors = [];

  if (!password || typeof password !== "string") {
    errors.push("Password is required");
    return errors;
  }

  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  if (password.length > 100) {
    errors.push("Password must be less than 100 characters");
  }

  if (!/(?=.*[a-zA-Z])/.test(password)) {
    errors.push("Password must contain at least one letter");
  }

  return errors;
}

export function validateQuizCode(code) {
  const errors = [];

  if (!code || typeof code !== "string") {
    errors.push("Quiz code is required");
    return errors;
  }

  const trimmed = code.trim().toUpperCase();

  if (!/^[A-Z0-9]{4,10}$/.test(trimmed)) {
    errors.push(
      "Quiz code must be 4-10 characters long and contain only letters and numbers"
    );
  }

  return errors;
}

export function validateQuizTitle(title) {
  const errors = [];

  if (!title || typeof title !== "string") {
    errors.push("Quiz title is required");
    return errors;
  }

  const trimmed = title.trim();

  if (trimmed.length < 3) {
    errors.push("Quiz title must be at least 3 characters long");
  }

  if (trimmed.length > 100) {
    errors.push("Quiz title must be less than 100 characters");
  }

  return errors;
}
