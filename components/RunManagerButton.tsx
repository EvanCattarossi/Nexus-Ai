"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function RunManagerButton({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const res = await fetch("/api/agents/manager/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Échec de l'exécution du Manager");
        return;
      }
      toast.success("Manager exécuté", {
        description: json.data?.summary || "Terminé sans résumé texte.",
      });
      router.refresh();
    } catch {
      toast.error("Erreur réseau lors de l'appel au Manager");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleClick} disabled={loading}>
      {loading ? "Le Manager travaille..." : "Run Manager"}
    </Button>
  );
}
