import { httpRouter } from "convex/server";

/**
 * HTTP endpoints for webhooks or external integrations
 *
 * Note: Admin authentication is handled via Convex mutations (not HTTP endpoints)
 * This allows both the Admin Mini App and Telegram bot (via n8n) to authenticate
 * using standard Convex function calls.
 */

const http = httpRouter();

// Placeholder for future webhook endpoints (e.g., Telegram, Chapa payment webhooks)
// http.route({
//   path: "/webhooks/telegram",
//   method: "POST",
//   handler: httpAction(async (ctx, request) => {
//     // Handle Telegram webhook
//   }),
// });

export default http;
