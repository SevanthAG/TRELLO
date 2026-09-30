export interface SignupErrors {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export interface SigninErrors {
  email?: string;
  password?: string;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

export function validateSignup(values: {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}): SignupErrors {
  const errors: SignupErrors = {};
  const username = values.username.trim();
  const email = values.email.trim();
  const { password, confirmPassword } = values;

  if (!username) errors.username = "Pick a username.";
  else if (username.length < 3) errors.username = "Min 3 characters.";
  else if (username.length > 20) errors.username = "Max 20 characters.";
  else if (!USERNAME_RE.test(username))
    errors.username = "Letters, numbers and _ only.";

  if (!email) errors.email = "Enter your email.";
  else if (!EMAIL_RE.test(email)) errors.email = "That email looks off.";

  if (!password) errors.password = "Create a password.";
  else if (password.length < 8) errors.password = "Min 8 characters.";
  else if (!/[a-z]/.test(password) || !/[A-Z]/.test(password))
    errors.password = "Add upper + lowercase letters.";
  else if (!/[0-9]/.test(password)) errors.password = "Add at least 1 number.";

  if (!confirmPassword) errors.confirmPassword = "Repeat your password.";
  else if (confirmPassword !== password)
    errors.confirmPassword = "Passwords don't match.";

  return errors;
}

export function validateSignin(values: {
  email: string;
  password: string;
}): SigninErrors {
  const errors: SigninErrors = {};
  const email = values.email.trim();

  if (!email) errors.email = "Enter your email.";
  else if (!EMAIL_RE.test(email)) errors.email = "That email looks off.";

  if (!values.password) errors.password = "Enter your password.";
  else if (values.password.length < 8)
    errors.password = "Password is min 8 characters.";

  return errors;
}

export function passwordScore(password: string): number {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  return score;
}
