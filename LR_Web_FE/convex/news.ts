import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listPublishedNews = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const q = ctx.db
      .query("news")
      .withIndex("by_published", (q) => q.eq("isPublished", true))
      .order("desc");

    if (args.limit) {
      return await q.take(args.limit);
    }
    return await q.collect();
  },
});

export const listAllNews = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("news").order("desc").collect();
  },
});

export const createNews = mutation({
  args: {
    title: v.string(),
    slug: v.optional(v.string()),
    perex: v.string(),
    content: v.string(),
    image: v.optional(v.string()),
    publishedAt: v.optional(v.string()),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("news", {
      title: args.title,
      slug: args.slug,
      perex: args.perex,
      content: args.content,
      image: args.image,
      publishedAt: args.publishedAt || new Date().toISOString().split("T")[0],
      isPublished: args.isPublished,
    });
  },
});

export const updateNews = mutation({
  args: {
    id: v.id("news"),
    title: v.string(),
    slug: v.optional(v.string()),
    perex: v.string(),
    content: v.string(),
    image: v.optional(v.string()),
    publishedAt: v.optional(v.string()),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteNews = mutation({
  args: { id: v.id("news") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
