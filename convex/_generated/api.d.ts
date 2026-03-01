/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as affiliates from "../affiliates.js";
import type * as auth from "../auth.js";
import type * as exchanges from "../exchanges.js";
import type * as favorites from "../favorites.js";
import type * as health from "../health.js";
import type * as hotLeads from "../hotLeads.js";
import type * as lib_activityLog from "../lib/activityLog.js";
import type * as lib_auth_adminAuth from "../lib/auth/adminAuth.js";
import type * as lib_logger from "../lib/logger.js";
import type * as lib_validators from "../lib/validators.js";
import type * as mutations_auth from "../mutations/auth.js";
import type * as mutations_categories from "../mutations/categories.js";
import type * as mutations_products from "../mutations/products.js";
import type * as mutations_sellers from "../mutations/sellers.js";
import type * as orders from "../orders.js";
import type * as phoneActions from "../phoneActions.js";
import type * as products from "../products.js";
import type * as search from "../search.js";
import type * as seedProducts from "../seedProducts.js";
import type * as sessions from "../sessions.js";
import type * as telegram from "../telegram.js";
import type * as testReferrals from "../testReferrals.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  affiliates: typeof affiliates;
  auth: typeof auth;
  exchanges: typeof exchanges;
  favorites: typeof favorites;
  health: typeof health;
  hotLeads: typeof hotLeads;
  "lib/activityLog": typeof lib_activityLog;
  "lib/auth/adminAuth": typeof lib_auth_adminAuth;
  "lib/logger": typeof lib_logger;
  "lib/validators": typeof lib_validators;
  "mutations/auth": typeof mutations_auth;
  "mutations/categories": typeof mutations_categories;
  "mutations/products": typeof mutations_products;
  "mutations/sellers": typeof mutations_sellers;
  orders: typeof orders;
  phoneActions: typeof phoneActions;
  products: typeof products;
  search: typeof search;
  seedProducts: typeof seedProducts;
  sessions: typeof sessions;
  telegram: typeof telegram;
  testReferrals: typeof testReferrals;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
