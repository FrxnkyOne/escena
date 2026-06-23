import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ExperienceClient } from "@/components/experience-client";
import type { Block } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ExperiencePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ print?: string }>;
}) {
  const { slug } = await params;
  const { print } = await searchParams;

  // Cliente anónimo: solo puede invocar la RPC pública acotada al slug.
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase.rpc("get_experience", { p_slug: slug });
  const exp = Array.isArray(data) ? data[0] : data;
  if (error || !exp) notFound();

  return (
    <ExperienceClient
      slug={slug}
      title={exp.title}
      description={exp.description}
      blocks={(exp.blocks ?? []) as Block[]}
      printMode={print === "1"}
    />
  );
}
