import { signOutAction } from "@/app/actions";
import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/utils/supabase/server";
import { UserCircle, LogOut } from "lucide-react";

export default async function AuthButton() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user ? (
    <div className="flex items-center gap-3">
      <Link 
        href="/dashboard" 
        className="group flex items-center gap-2 rounded-full bg-secondary/40 px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary"
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/10 text-accent">
          {user.email ? user.email[0].toUpperCase() : 'A'}
        </span>
        <span className="text-foreground">
          {user.email?.split('@')[0] || 'Account'}
        </span>
      </Link>
      <form action={signOutAction}>
        <Button 
          type="submit" 
          variant="ghost" 
          size="icon"
          className="h-8 w-8 rounded-full"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      </form>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button asChild size="sm" variant="ghost" className="rounded-full">
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button 
        asChild 
        size="sm" 
        variant="default" 
        className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground  shadow-accent/25"
      >
      </Button>
    </div>
  );
}
