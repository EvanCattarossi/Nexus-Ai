import type { Memory } from "@prisma/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { parseTags } from "@/lib/services/memory";

function MemoryList({ memories }: { memories: Memory[] }) {
  if (memories.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
        Rien pour l&apos;instant.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {memories.map((memory) => (
        <Card key={memory.id} className="gap-2 py-3">
          <CardHeader className="px-3">
            <CardTitle className="text-sm font-medium">{memory.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 px-3">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{memory.content}</p>
            <div className="flex flex-wrap items-center gap-2">
              {parseTags(memory.tags).map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
              <span className="ml-auto text-xs text-muted-foreground">
                {new Date(memory.createdAt).toLocaleString("fr-FR")}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function MemoryPanel({ memories }: { memories: Memory[] }) {
  return (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger value="all">Toutes</TabsTrigger>
        <TabsTrigger value="fact">Faits</TabsTrigger>
        <TabsTrigger value="decision">Décisions</TabsTrigger>
        <TabsTrigger value="note">Notes</TabsTrigger>
      </TabsList>
      <TabsContent value="all" className="mt-4">
        <MemoryList memories={memories} />
      </TabsContent>
      {(["fact", "decision", "note"] as const).map((type) => (
        <TabsContent key={type} value={type} className="mt-4">
          <MemoryList memories={memories.filter((m) => m.type === type)} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
