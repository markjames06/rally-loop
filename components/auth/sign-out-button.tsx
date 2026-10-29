import { LogOut } from "lucide-react";

import { signOutAction } from "@/server/auth/actions";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button
        className="sign-out-button rounded-md"
        variant="outline"
      >
        <LogOut aria-hidden="true" className="size-4" />
        Sign out
      </Button>
    </form>
  );
}
