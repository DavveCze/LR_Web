/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as calendar from "../calendar.js";
import type * as content from "../content.js";
import type * as csts from "../csts.js";
import type * as dancers from "../dancers.js";
import type * as emails from "../emails.js";
import type * as inquiries from "../inquiries.js";
import type * as news from "../news.js";
import type * as registrations from "../registrations.js";
import type * as schedule from "../schedule.js";
import type * as seed from "../seed.js";
import type * as storage from "../storage.js";
import type * as trainers from "../trainers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  calendar: typeof calendar;
  content: typeof content;
  csts: typeof csts;
  dancers: typeof dancers;
  emails: typeof emails;
  inquiries: typeof inquiries;
  news: typeof news;
  registrations: typeof registrations;
  schedule: typeof schedule;
  seed: typeof seed;
  storage: typeof storage;
  trainers: typeof trainers;
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
