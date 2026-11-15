import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listTrainers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("trainers")
      .withIndex("by_order", (q) => q.eq("isActive", true))
      .collect();
  },
});

export const listAllTrainers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("trainers").collect();
  },
});

export const createTrainer = mutation({
  args: {
    name: v.string(),
    role: v.string(),
    bio: v.string(),
    image: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("trainers", args);
  },
});

export const updateTrainer = mutation({
  args: {
    id: v.id("trainers"),
    name: v.string(),
    role: v.string(),
    bio: v.string(),
    image: v.optional(v.string()),
    order: v.number(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteTrainer = mutation({
  args: { id: v.id("trainers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
