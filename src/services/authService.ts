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
  if (user && password === 'pass@123') {
    if (!user.is_active) {
      return null;
    }
    return user;
  }
  return null;
};

export const verifyPassword = async (
  password: string
): Promise<boolean> => {
  // Simulated delay to mimic network latency
  await new Promise((resolve) => setTimeout(resolve, 300));
  return password === 'pass@123';
};
