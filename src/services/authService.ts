import type { User } from '@/types';

/**
 * Pure service for user authentication.
 */
export const authenticateUser = async (
  users: User[],
  username: string,
  password: string
): Promise<User | null> => {
  // Simulated delay to mimic network latency
  await new Promise((resolve) => setTimeout(resolve, 500));

  const user = users.find((u) => u.username === username);
  const expectedPassword = user?.password || 'pass@123';
  if (user && password === expectedPassword) {
    if (!user.is_active) {
      return null;
    }
    return user;
  }
  return null;
};

export const verifyPassword = async (
  password: string,
  currentUser?: User | null
): Promise<boolean> => {
  // Simulated delay to mimic network latency
  await new Promise((resolve) => setTimeout(resolve, 300));
  const expected = currentUser?.password || 'pass@123';
  return password === expected;
};
