const TOKEN_KEY = 'qa_dashboard_token';
const USER_KEY = 'qa_dashboard_user';

export function setAuth(token, user) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    return null;
  }
}

export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export function getAuth() {
  const token = getToken();
  const user = getUser();
  if (!token) return null;
  return { token, user };
}

export function isLoggedIn() {
  return !!getToken();
}

export function isAdmin() {
  const user = getUser();
  return user && user.role === 'admin';
}
