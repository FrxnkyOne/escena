import { redirect } from "next/navigation";

export default function Home() {
  // El middleware redirige sesiones activas a /dashboard.
  redirect("/login");
}
