import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface OrderTabsProps {
  defaultTab?: "actions" | "exchanges";
  actionsContent: ReactNode;
  exchangesContent: ReactNode;
  actionsCount?: number;
  exchangesCount?: number;
  className?: string;
}

export function OrderTabs({
  defaultTab = "actions",
  actionsContent,
  exchangesContent,
  actionsCount,
  exchangesCount,
  className,
}: OrderTabsProps) {
  return (
    <Tabs defaultValue={defaultTab} className={cn("w-full", className)}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="actions" className="relative">
          Orders
          {actionsCount !== undefined && actionsCount > 0 && (
            <span className="ml-2 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
              {actionsCount}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="exchanges" className="relative">
          Exchanges
          {exchangesCount !== undefined && exchangesCount > 0 && (
            <span className="ml-2 rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-semibold">
              {exchangesCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="actions" className="mt-4">
        {actionsContent}
      </TabsContent>
      <TabsContent value="exchanges" className="mt-4">
        {exchangesContent}
      </TabsContent>
    </Tabs>
  );
}
