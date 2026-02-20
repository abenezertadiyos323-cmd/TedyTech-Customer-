import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

type ActivityEntityType = "product" | "order" | "exchange" | "hotLead";

type ActivityMetadata = Record<string, unknown> | undefined;

export async function createActivityLog(
  ctx: MutationCtx,
  args: {
    sellerId: Id<"sellers">;
    actor?: string;
    entityType: ActivityEntityType;
    entityId: string;
    action: string;
    summary: string;
    metadata?: ActivityMetadata;
  },
) {
  const metadata = args.metadata
    ? Object.fromEntries(
        Object.entries(args.metadata).filter(([, value]) => value !== undefined),
      )
    : undefined;

  await ctx.db.insert("activityLogs", {
    sellerId: args.sellerId,
    createdAt: Date.now(),
    actor: args.actor,
    entityType: args.entityType,
    entityId: args.entityId,
    action: args.action,
    summary: args.summary,
    metadata: metadata && Object.keys(metadata).length > 0 ? metadata : undefined,
  });
}
