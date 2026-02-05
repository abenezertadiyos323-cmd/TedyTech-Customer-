/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as http from "../http.js";
import type * as lib_auth_adminAuth from "../lib/auth/adminAuth.js";
import type * as lib_validators from "../lib/validators.js";
import type * as mutations_categories from "../mutations/categories.js";
import type * as mutations_products from "../mutations/products.js";
import type * as mutations_sellers from "../mutations/sellers.js";
import type * as queries_categories from "../queries/categories.js";
import type * as queries_products from "../queries/products.js";
import type * as queries_sellers from "../queries/sellers.js";
import type * as seedAdmin from "../seedAdmin.js";
import type * as store from "../store.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  http: typeof http;
  "lib/auth/adminAuth": typeof lib_auth_adminAuth;
  "lib/validators": typeof lib_validators;
  "mutations/categories": typeof mutations_categories;
  "mutations/products": typeof mutations_products;
  "mutations/sellers": typeof mutations_sellers;
  "queries/categories": typeof queries_categories;
  "queries/products": typeof queries_products;
  "queries/sellers": typeof queries_sellers;
  seedAdmin: typeof seedAdmin;
  store: typeof store;
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
