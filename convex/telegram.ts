import { mutation } from "convex/server";

// Simple Convex action to verify a Telegram identity and associate it with a session/customer.
// This is a lightweight replacement for the previous Supabase edge function.
export const verifyTelegram = mutation(
  async (
    { db },
    {
      telegramId,
      code,
      customerId,
    }: { telegramId: string; code?: string; customerId?: string },
  ) => {
    // Upsert a simple session record keyed by telegramId.
    // If you have a more advanced verification flow (e.g., checking an external API), replace this logic.
    const existing = await db
      .table("sessions")
      .filter((q) => q.eq(q.field("telegramId"), telegramId))
      .first();
    if (existing) {
      await db
        .table("sessions")
        .update(existing._id, {
          verified: true,
          updatedAt: Date.now(),
          code: code ?? null,
        });
      return { ok: true, created: false };
    }

    await db
      .table("sessions")
      .insert({
        telegramId,
        customerId: customerId ?? null,
        verified: true,
        code: code ?? null,
        createdAt: Date.now(),
      });
    return { ok: true, created: true };
  },
);
