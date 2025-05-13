import FetchDataSteps from "@/components/tutorial/fetch-data-steps";
import { createClient } from "@/utils/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProtectedPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
          <InfoIcon size="16" strokeWidth={2} />
          Welcome to the Custom Quote Builder App
        </div>
      </div>
      
      <div className="flex flex-col gap-6">
        <h2 className="font-bold text-2xl">Get Started</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/form-builder" 
            className="p-6 border rounded-lg hover:bg-accent transition-colors flex flex-col gap-2"
          >
            <h3 className="font-semibold text-xl">Create Quote Form</h3>
            <p className="text-sm text-muted-foreground">
              Build a customizable quote form and export the code to use on your website.
            </p>
          </Link>
        </div>
      </div>
      
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>
      <div>
        <h2 className="font-bold text-2xl mb-4">Next steps</h2>
        <FetchDataSteps />
      </div>
    </div>
  );
}
