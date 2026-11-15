import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getContent = query({
  args: { pageKey: v.string() },
  handler: async (ctx, args) => {
    const page = await ctx.db
      .query("content_pages")
      .withIndex("by_pageKey", (q) => q.eq("pageKey", args.pageKey))
      .first();

    return page?.data || null;
  },
});

export const updateContent = mutation({
  args: {
    pageKey: v.string(),
    data: v.any(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("content_pages")
      .withIndex("by_pageKey", (q) => q.eq("pageKey", args.pageKey))
      .first();

    const updatedAt = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        data: args.data,
        updatedAt,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("content_pages", {
        pageKey: args.pageKey,
        data: args.data,
        updatedAt,
      });
    }
  },
});

export const listPages = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("content_pages").collect();
  },
});
