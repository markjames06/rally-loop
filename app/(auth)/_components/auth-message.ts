export function getAuthMessage(reason?: string): string | undefined {
  switch (reason) {
    case "setup":
      return "Add your Supabase URL and publishable key to .env.local, then restart the app.";
    case "verification":
      return "We could not verify your session. Please try signing in again.";
    case "confirmation":
      return "That confirmation link is invalid or expired. Request a new sign-up confirmation.";
    default:
      return undefined;
  }
}
