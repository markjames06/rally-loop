import { LogOut } from "lucide-react";

import { signOutAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction} className="w-full">
      <Button
        className="sign-out-button w-full h-8 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 hover:border-rose-200 border-slate-200 transition-colors"
        size="sm"
        type="submit"
        variant="outline"
      >
        <LogOut aria-hidden="true" className="size-3.5" />
        Sign out
      </Button>
    </form>
  );
}
