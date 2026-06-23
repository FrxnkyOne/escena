import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Topbar } from "@/components/topbar";
import { ToastProvider } from "@/components/toast";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles").select("name").eq("id", user.id).single();

  return (
    <ToastProvider>
      <Topbar userName={profile?.name || user.email || "Usuario"} />
      {children}
    </ToastProvider>
  );
}
