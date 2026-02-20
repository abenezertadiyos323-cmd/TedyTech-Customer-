import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useRecentActivity } from "@/hooks/useActivity";
import { formatDateTime } from "@/lib/utils";
import type { Activity } from "@/types/admin";
import { AlertCircle, Bell, Loader2 } from "lucide-react";

function getEntityType(activity: Activity) {
  if (
    activity.type === "product" ||
    activity.type === "order" ||
    activity.type === "exchange" ||
    activity.type === "hotLead"
  ) {
    return activity.type;
  }
  return "order";
}

export function ActivityTab() {
  const { data: activities, isLoading, error } = useRecentActivity(100);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-destructive/10 p-4 mb-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <p className="font-semibold">Failed to load activity</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Bell className="h-8 w-8 text-muted-foreground" />
        </div>
        <p className="font-semibold">No activity yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Admin updates will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      {activities.map((activity) => (
        <Card key={activity.id} className="admin-card">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Badge variant="outline">{getEntityType(activity)}</Badge>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(activity.timestamp)}
              </p>
            </div>
            <p className="text-sm">{activity.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
