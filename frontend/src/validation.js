// Client-side form validation (the backend validates again - never trust the browser alone).
export function validateLogin({ email, password }) {
  const errors = {};
  if (!email.trim()) errors.email = 'Email is required';
  else if (!/^\S+@\S+\.\S+$/.test(email)) errors.email = 'Enter a valid email address';
  if (!password) errors.password = 'Password is required';
  return errors;
}

export function validateRegister({ fullName, email, password }) {
  const errors = validateLogin({ email, password });
  if (!fullName.trim()) errors.fullName = 'Name is required';
  if (password && password.length < 8) errors.password = 'Password must be at least 8 characters';
  return errors;
}
