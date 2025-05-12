import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import FormBuilderComponent from "@/components/form-builder/FormBuilder";
import "./styles.css";

export default async function FormBuilderPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="flex-1 w-full flex flex-col max-w-7xl mx-auto gap-6 dark:bg-black">
      <div className="w-full border-b border-zinc-200 dark:border-zinc-800 pb-6 mb-2">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">Quote Form Builder</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Create customizable quote forms and export the code to use on your website.
        </p>
      </div>
      <FormBuilderComponent userId={user.id} />
    </div>
  );
} 