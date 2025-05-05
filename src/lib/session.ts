const SESSION_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds

export const setSession = (adminId: string, name: string, email: string) => {
  const sessionData = {
    adminId,
    name,
    email,
    expiresAt: Date.now() + SESSION_DURATION
  };
  localStorage.setItem('adminSession', JSON.stringify(sessionData));
};

export const getSession = () => {
  const sessionStr = localStorage.getItem('adminSession');
  if (!sessionStr) return null;

  const session = JSON.parse(sessionStr);
  if (Date.now() > session.expiresAt) {
    localStorage.removeItem('adminSession');
    return null;
  }

  return session;
};

export const clearSession = () => {
  localStorage.removeItem('adminSession');
}; 