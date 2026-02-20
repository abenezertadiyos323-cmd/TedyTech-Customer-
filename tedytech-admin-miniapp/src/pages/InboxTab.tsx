import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { OrderList } from "@/components/orders/OrderList";
import { useHotLeads } from "@/hooks/useHotLeads";
import type { AdminHotLead } from "@/types/hotLead";
import { formatDateTime } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function InboxTab() {
  const { leads, isLoading, error, markContacted, saveNote } = useHotLeads();
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const handleMarkContacted = async (leadId: string) => {
    setUpdatingLeadId(leadId);
    setMutationError(null);
    try {
      await markContacted(leadId);
    } catch (err) {
      setMutationError((err as Error).message || "Failed to update lead.");
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const handleSaveNote = async (lead: AdminHotLead) => {
    setUpdatingLeadId(lead._id);
    setMutationError(null);
    try {
      const note = draftNotes[lead._id] ?? lead.adminNote ?? "";
      await saveNote(lead._id, note);
    } catch (err) {
      setMutationError((err as Error).message || "Failed to save note.");
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const getCustomerLabel = (lead: AdminHotLead) => {
    return (
      lead.customerName ||
      lead.customerPhone ||
      lead.telegramUserId ||
      "Unknown customer"
    );
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {mutationError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {mutationError}
        </div>
      )}

      <OrderList
        items={leads}
        isLoading={isLoading}
        error={error}
        emptyMessage="No hot leads yet"
        emptyDescription="Leads captured from bot and mini app will appear here"
        renderItem={(lead) => {
          const isUpdating = updatingLeadId === lead._id;
          const noteValue = draftNotes[lead._id] ?? lead.adminNote ?? "";

          return (
            <Card className="admin-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant={lead.status === "contacted" ? "success" : "warning"}>
                    {lead.status}
                  </Badge>
                  <p className="text-xs text-muted-foreground">{formatDateTime(lead.createdAt)}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-semibold text-sm">{getCustomerLabel(lead)}</p>
                  {lead.customerPhone && (
                    <p className="text-xs text-muted-foreground mt-0.5">{lead.customerPhone}</p>
                  )}
                  {lead.source && (
                    <p className="text-xs text-muted-foreground mt-0.5">Source: {lead.source}</p>
                  )}
                </div>

                {(lead.interestSummary || lead.message) && (
                  <div>
                    <p className="text-xs text-muted-foreground">Interest</p>
                    <p className="text-sm">{lead.interestSummary || lead.message}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Admin Note</p>
                  <Input
                    value={noteValue}
                    onChange={(event) =>
                      setDraftNotes((prev) => ({
                        ...prev,
                        [lead._id]: event.target.value,
                      }))
                    }
                    placeholder="Add note"
                    disabled={isUpdating}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="min-h-[38px]"
                    disabled={isUpdating || lead.status === "contacted"}
                    onClick={() => void handleMarkContacted(lead._id)}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Mark Contacted"
                    )}
                  </Button>
                  <Button
                    className="min-h-[38px]"
                    disabled={isUpdating}
                    onClick={() => void handleSaveNote(lead)}
                  >
                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Note"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        }}
      />
    </div>
  );
}
