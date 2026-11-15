import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listPairs = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("dancers")
      .withIndex("by_type", (q) => q.eq("type", "pair").eq("isActive", true))
      .collect();
  },
});

export const listSingles = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("dancers")
      .withIndex("by_type", (q) => q.eq("type", "single").eq("isActive", true))
      .collect();
  },
});

export const listAllDancers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("dancers").collect();
  },
});

export const createDancer = mutation({
  args: {
    type: v.union(v.literal("pair"), v.literal("single")),
    manName: v.optional(v.string()),
    womanName: v.optional(v.string()),
    name: v.optional(v.string()),
    category: v.string(),
    cstsIdtMan: v.optional(v.string()),
    cstsIdtWoman: v.optional(v.string()),
    sex: v.optional(v.union(v.literal("M"), v.literal("F"))),
    disciplines: v.optional(v.array(v.string())),
    isActive: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dancers", args);
  },
});

export const updateDancer = mutation({
  args: {
    id: v.id("dancers"),
    type: v.union(v.literal("pair"), v.literal("single")),
    manName: v.optional(v.string()),
    womanName: v.optional(v.string()),
    name: v.optional(v.string()),
    category: v.string(),
    cstsIdtMan: v.optional(v.string()),
    cstsIdtWoman: v.optional(v.string()),
    sex: v.optional(v.union(v.literal("M"), v.literal("F"))),
    disciplines: v.optional(v.array(v.string())),
    isActive: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteDancer = mutation({
  args: { id: v.id("dancers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Soutěžní výsledky
export const listResults = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const q = ctx.db.query("competition_results").withIndex("by_date").order("desc");
    if (args.limit) {
      return await q.take(args.limit);
    }
    return await q.collect();
  },
});

export const createResult = mutation({
  args: {
    competitionName: v.string(),
    date: v.string(),
    location: v.optional(v.string()),
    category: v.string(),
    dancerNames: v.string(),
    placement: v.string(),
    points: v.optional(v.string()),
    finals: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("competition_results", {
      ...args,
      createdAt: new Date().toISOString(),
    });
  },
});

export const deleteResult = mutation({
  args: { id: v.id("competition_results") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
