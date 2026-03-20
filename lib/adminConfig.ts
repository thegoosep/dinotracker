// Admin user IDs - users with admin panel access
export const ADMIN_USER_IDS = [
  '1194421789548351508', // Primary admin
];

// Check if a user ID is an admin
export function isAdmin(userId: string | undefined): boolean {
  if (!userId) return false;
  return ADMIN_USER_IDS.includes(userId);
}
