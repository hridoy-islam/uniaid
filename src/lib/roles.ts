// Roles whose access is set per user on the privilege screen (staff/:id,
// teachers/:id). Anywhere a page asks "what is this user allowed to do?",
// these roles answer from their privileges; admin is allowed everything.
export const PRIVILEGED_ROLES = ['staff', 'teacher'];

export const isPrivilegedRole = (role?: string) =>
  !!role && PRIVILEGED_ROLES.includes(role);
