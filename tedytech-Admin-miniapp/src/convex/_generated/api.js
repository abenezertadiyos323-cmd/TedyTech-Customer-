/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api = createApi({
  affiliates: {
    create: { isAction: false, isQuery: false, isMutation: true },
    getByReferralCode: { isAction: false, isQuery: true, isMutation: false },
  },
  favorites: {
    add: { isAction: false, isQuery: false, isMutation: true },
    remove: { isAction: false, isQuery: false, isMutation: true },
    list: { isAction: false, isQuery: true, isMutation: false },
  },
  "lib/auth/adminAuth": {},
  "lib/validators": {},
  "mutations/categories": {},
  "mutations/products": {
    updateExchangeStatus: { isAction: false, isQuery: false, isMutation: true },
  },
  "mutations/sellers": {},
  phoneActions: {
    create: { isAction: false, isQuery: false, isMutation: true },
    list: { isAction: false, isQuery: true, isMutation: false },
    getRecent: { isAction: false, isQuery: true, isMutation: false },
  },
  products: {
    list: { isAction: false, isQuery: true, isMutation: false },
    getById: { isAction: false, isQuery: true, isMutation: false },
    search: { isAction: false, isQuery: true, isMutation: false },
    listExchangeRequests: { isAction: false, isQuery: true, isMutation: false },
  },
  search: {
    recordSearch: { isAction: false, isQuery: false, isMutation: true },
  },
  seedProducts: {},
  sessions: {
    create: { isAction: false, isQuery: false, isMutation: true },
  },
  telegram: {},
});

export const internal = createApi({});
export const components = {};

function createApi(modules) {
  return new Proxy(modules, {
    get(target, moduleName) {
      if (!(moduleName in target)) {
        return undefined;
      }
      return new Proxy(target[moduleName], {
        get(moduleTarget, functionName) {
          return {
            _module: moduleName,
            _function: functionName,
            ...moduleTarget[functionName],
          };
        },
      });
    },
  });
}
