import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button
        className="rounded-full border-white/15 text-slate-200 hover:bg-white/10 hover:text-white"
        variant="outline"
      >
        Sign out
      </Button>
    </form>
  );
}
