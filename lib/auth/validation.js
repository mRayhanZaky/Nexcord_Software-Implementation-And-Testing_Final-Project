export const secretQuestions = [
  "What was the name of your first pet?",
  "What city were you born in?",
  "What was your childhood nickname?",
  "What is your favorite game?",
  "What was your first school?",
];

export function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function usernameError(value) {
  if (!value) return "Username is required.";
  if (/\s/.test(value)) return "Username cannot contain spaces.";
  if (!/^[a-zA-Z0-9_]{3,24}$/.test(value)) return "Use 3-24 letters, numbers, or underscores.";
  return "";
}

export function passwordChecks(password) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

export function passwordScore(password) {
  return Object.values(passwordChecks(password)).filter(Boolean).length;
}

export function passwordError(password) {
  const checks = passwordChecks(password);
  if (!checks.length) return "Password must be at least 8 characters.";
  if (!checks.uppercase) return "Add an uppercase letter.";
  if (!checks.lowercase) return "Add a lowercase letter.";
  if (!checks.number) return "Add a number.";
  if (!checks.special) return "Add a special character.";
  return "";
}
