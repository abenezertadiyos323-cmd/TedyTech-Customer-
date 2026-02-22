/**
 * TEMPORARY TEST FILE — convex/testReferrals.ts
 * Safe for production execution. Remove after validation.
 *
 * Run (dry-run, no DB writes):
 *   npx convex run testReferrals:runReferralTests --prod
 *
 * Run (full test, writes + cleanup):
 *   npx convex run testReferrals:runReferralTests --prod '{"dryRun":false}'
 *
 * Test Telegram IDs are in the 9999900001–9999900002 range.
 * Real Telegram user IDs are never this high (max ~8 billion, but test
 * prefix 999990XXXX is reserved exclusively for this file).
 */

import { internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";
import { v } from "convex/values";

// ── Safe test ID range: 999990XXXX ───────────────────────────────────────────
// Never collide with real Telegram IDs. All created docs use this prefix.
const A_TID = 9999900001;
const B_TID = 9999900002;
const TEST_TIDS = [A_TID, B_TID] as const;

// ── DB helpers (internal — not callable from client) ─────────────────────────

export const _setupTestCustomer = internalMutation({
  args: { telegramId: v.number(), firstName: v.string(), dryRun: v.boolean() },
  handler: async (ctx, args) => {
    if (args.dryRun) {
      console.log(
        `  [DRY-RUN] Would create customer telegramId=${args.telegramId} firstName=${args.firstName}`,
      );
      return "dry-run-id" as unknown as ReturnType<typeof ctx.db.insert>;
    }

    // Wipe stale record from a previous run
    const existing = await ctx.db
      .query("customers")
      .withIndex("by_telegramUserId", (q) => q.eq("telegramUserId", args.telegramId))
      .first();
    if (existing) {
      console.log(
        `  [SETUP] Deleted stale customer _id=${existing._id} telegramId=${args.telegramId}`,
      );
      await ctx.db.delete(existing._id);
    }

    const id = await ctx.db.insert("customers", {
      telegramUserId: args.telegramId,
      firstName: args.firstName,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    console.log(`  [SETUP] Created customer _id=${id} telegramId=${args.telegramId}`);
    return id;
  },
});

export const _cleanupTestData = internalMutation({
  args: { telegramIds: v.array(v.number()), dryRun: v.boolean() },
  handler: async (ctx, args) => {
    for (const tid of args.telegramIds) {
      // Guard: refuse to delete any record whose telegramId is outside the
      // reserved test range. Prevents accidental deletion of real users.
      if (tid < 9999900000 || tid > 9999999999) {
        console.error(`  [CLEANUP] BLOCKED — telegramId=${tid} is outside safe test range`);
        continue;
      }

      const customer = await ctx.db
        .query("customers")
        .withIndex("by_telegramUserId", (q) => q.eq("telegramUserId", tid))
        .first();

      if (customer) {
        const affiliate = await ctx.db
          .query("affiliates")
          .withIndex("by_customerId", (q) => q.eq("customerId", customer._id))
          .first();
        if (affiliate) {
          if (args.dryRun) {
            console.log(`  [DRY-RUN] Would delete affiliate _id=${affiliate._id}`);
          } else {
            await ctx.db.delete(affiliate._id);
            console.log(`  [CLEANUP] Deleted affiliate _id=${affiliate._id}`);
          }
        }
        if (args.dryRun) {
          console.log(`  [DRY-RUN] Would delete customer _id=${customer._id} telegramId=${tid}`);
        } else {
          await ctx.db.delete(customer._id);
          console.log(`  [CLEANUP] Deleted customer _id=${customer._id} telegramId=${tid}`);
        }
      }

      const referral = await ctx.db
        .query("referrals")
        .withIndex("by_referredTelegramId", (q) => q.eq("referredTelegramId", tid))
        .first();
      if (referral) {
        if (args.dryRun) {
          console.log(`  [DRY-RUN] Would delete referral _id=${referral._id}`);
        } else {
          await ctx.db.delete(referral._id);
          console.log(`  [CLEANUP] Deleted referral _id=${referral._id} referredTelegramId=${tid}`);
        }
      }
    }
  },
});

export const _getTestReferral = internalQuery({
  args: { referredTelegramId: v.number() },
  handler: async (ctx, args) =>
    ctx.db
      .query("referrals")
      .withIndex("by_referredTelegramId", (q) =>
        q.eq("referredTelegramId", args.referredTelegramId),
      )
      .first(),
});

export const _getTestCustomerEarnings = internalQuery({
  args: { telegramId: v.number() },
  handler: async (ctx, args) => {
    const c = await ctx.db
      .query("customers")
      .withIndex("by_telegramUserId", (q) => q.eq("telegramUserId", args.telegramId))
      .first();
    return c?.earningsTotal ?? 0;
  },
});

// ── Test runner ───────────────────────────────────────────────────────────────

export const runReferralTests = internalAction({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    // Default: dryRun=true for safety. Pass {"dryRun":false} to write.
    const DRY_RUN = args.dryRun !== false;

    let passed = 0;
    let failed = 0;

    const pass = (label: string) => {
      console.log(`  PASS: ${label}`);
      passed++;
    };
    const fail = (label: string, detail?: string) => {
      console.error(`  FAIL: ${label}${detail ? ` — ${detail}` : ""}`);
      failed++;
    };

    console.log("══════════════════════════════════════════════════");
    console.log(`  TedyTech Referral Regression Test`);
    console.log(`  Mode : ${DRY_RUN ? "DRY-RUN (no DB writes)" : "FULL (writes + cleanup)"}`);
    console.log(`  Test IDs : A=${A_TID}  B=${B_TID}`);
    console.log("══════════════════════════════════════════════════");

    if (DRY_RUN) {
      console.log("\n  DRY-RUN: all mutation calls are logged but skipped.");
      console.log("  Re-run with {\"dryRun\":false} to execute fully.\n");
      return { passed: 0, failed: 0, dryRun: true };
    }

    // ── try/finally guarantees cleanup even on mid-test failure ──────────────
    try {
      // ── Pre-test cleanup ────────────────────────────────────────────────────
      console.log("\n[Pre-test] Cleaning up any stale test data…");
      await ctx.runMutation(internal.testReferrals._cleanupTestData, {
        telegramIds: [...TEST_TIDS],
        dryRun: false,
      });

      // ── Step 1: Create customer A + affiliate ───────────────────────────────
      console.log("\nStep 1: Create affiliate for user A (telegramId=9999900001)");

      const customerAId = await ctx.runMutation(
        internal.testReferrals._setupTestCustomer,
        { telegramId: A_TID, firstName: "Alice", dryRun: false },
      );

      const affiliateId = await ctx.runMutation(
        api.affiliates.createAffiliateIfNotExists,
        { customerId: customerAId as string, firstName: "Alice", telegramId: A_TID },
      );
      console.log(`  [SETUP] Created affiliate _id=${affiliateId}`);

      if (affiliateId) {
        pass("Affiliate created for user A");
      } else {
        fail("Affiliate creation returned null");
      }

      // Deterministic: "ALIC" + last-4 of A_TID ("0001") = "ALIC0001"
      const expectedCode = `ALIC${A_TID.toString().slice(-4)}`;
      console.log(`  Expected referral code: ${expectedCode}`);

      // ── Step 2: Create customer B, create referral ──────────────────────────
      console.log("\nStep 2: User B uses A's referral code");

      const customerBId = await ctx.runMutation(
        internal.testReferrals._setupTestCustomer,
        { telegramId: B_TID, firstName: "Bob", dryRun: false },
      );
      console.log(`  [SETUP] Created customer B _id=${customerBId}`);

      const result2 = await ctx.runMutation(api.affiliates.createReferralIfValid, {
        referralCode: expectedCode,
        referredTelegramId: B_TID,
        referredName: "Bob",
      });

      if (result2 === true) {
        pass("createReferralIfValid returned true");
      } else {
        fail("createReferralIfValid returned false unexpectedly");
      }

      // ── Step 3: Duplicate referral attempt ──────────────────────────────────
      console.log("\nStep 3: Duplicate referral attempt for same user B");

      const result3 = await ctx.runMutation(api.affiliates.createReferralIfValid, {
        referralCode: expectedCode,
        referredTelegramId: B_TID,
        referredName: "Bob",
      });

      if (result3 === false) {
        pass("Duplicate referral correctly rejected (false)");
      } else {
        fail("Duplicate referral was NOT rejected");
      }

      // ── Step 4: markReferralPaid ─────────────────────────────────────────────
      console.log("\nStep 4: markReferralPaid — purchaseAmount=10000, expect commission=500");

      const result4 = await ctx.runMutation(api.affiliates.markReferralPaid, {
        referredTelegramId: B_TID,
        purchaseAmount: 10000,
        orderId: "test_order_001",
      });

      if (result4 === true) {
        pass("markReferralPaid returned true");
      } else {
        fail("markReferralPaid returned false unexpectedly");
      }

      const referral = await ctx.runQuery(internal.testReferrals._getTestReferral, {
        referredTelegramId: B_TID,
      });
      console.log(
        `  [VERIFY] referral.status=${referral?.status} commissionAmount=${referral?.commissionAmount}`,
      );

      if (referral?.status === "paid") {
        pass("referral.status = 'paid'");
      } else {
        fail("referral.status wrong", String(referral?.status));
      }

      if (referral?.commissionAmount === 500) {
        pass("commissionAmount = 500 (5% of 10000)");
      } else {
        fail("commissionAmount wrong", String(referral?.commissionAmount));
      }

      const earningsAfterPay = await ctx.runQuery(
        internal.testReferrals._getTestCustomerEarnings,
        { telegramId: A_TID },
      );
      console.log(`  [VERIFY] referrer earningsTotal=${earningsAfterPay}`);

      if (earningsAfterPay === 500) {
        pass("referrer earningsTotal = 500");
      } else {
        fail("referrer earningsTotal wrong", String(earningsAfterPay));
      }

      // ── Step 5: Double-pay attempt ───────────────────────────────────────────
      console.log("\nStep 5: Double-pay attempt (should be rejected)");

      const result5 = await ctx.runMutation(api.affiliates.markReferralPaid, {
        referredTelegramId: B_TID,
        purchaseAmount: 10000,
        orderId: "test_order_002",
      });

      if (result5 === false) {
        pass("Double-pay correctly rejected (false)");
      } else {
        fail("Double-pay was NOT rejected");
      }

      const earningsAfterDoublePay = await ctx.runQuery(
        internal.testReferrals._getTestCustomerEarnings,
        { telegramId: A_TID },
      );
      console.log(`  [VERIFY] earningsTotal after double-pay attempt: ${earningsAfterDoublePay}`);

      if (earningsAfterDoublePay === earningsAfterPay) {
        pass(`earningsTotal unchanged after double-pay (still ${earningsAfterDoublePay})`);
      } else {
        fail(
          "earningsTotal changed after double-pay",
          `before=${earningsAfterPay} after=${earningsAfterDoublePay}`,
        );
      }
    } finally {
      // ── Always runs — even on unexpected throw ─────────────────────────────
      console.log("\n[Finally] Cleaning up test data…");
      try {
        await ctx.runMutation(internal.testReferrals._cleanupTestData, {
          telegramIds: [...TEST_TIDS],
          dryRun: false,
        });
        console.log("  [CLEANUP] Complete.");
      } catch (cleanupErr) {
        console.error("  [CLEANUP] ERROR during cleanup:", String(cleanupErr));
        console.error("  Manual cleanup required for telegramIds:", TEST_TIDS);
      }

      // ── Summary ─────────────────────────────────────────────────────────────
      console.log("\n══════════════════════════════════════════════════");
      console.log(`  Passed : ${passed}`);
      console.log(`  Failed : ${failed}`);
      console.log(
        failed === 0
          ? "  ✓ ALL TESTS PASSED"
          : `  ✗ ${failed} TEST(S) FAILED`,
      );
      console.log("══════════════════════════════════════════════════\n");
    }

    return { passed, failed, dryRun: false };
  },
});
