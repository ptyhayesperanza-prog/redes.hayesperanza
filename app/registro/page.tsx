import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AuthBrandPanel, AuthMobileHeader } from "@/components/AuthBrandPanel";
import { RegistroForm } from "./RegistroForm";

export default async function RegistroPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/");

  return (
    <main className="grid min-h-full flex-1 lg:grid-cols-[1.1fr_1fr]">
      <AuthBrandPanel />

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <AuthMobileHeader />

          <h1 className="font-[family-name:var(--font-fraunces)] text-2xl">Únete a tu red</h1>
          <p className="mt-1 mb-6 text-sm opacity-70">
            Crea tu cuenta y avísale al admin para que te confirme.
          </p>
          <RegistroForm />
        </div>
      </div>
    </main>
  );
}
