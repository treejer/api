export function getAdminMailList(): string[] {
  return process.env.ADMIN_EMAILS ? process.env.ADMIN_EMAILS?.split(",") : [];
}
