import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listRegistrations = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("registrations").collect();
  },
});

export const createRegistration = mutation({
  args: {
    title: v.string(),
    subtitle: v.optional(v.string()),
    url: v.string(),
    category: v.optional(v.string()),
    cost: v.optional(v.string()),
    isActive: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("registrations", args);
  },
});

export const updateRegistration = mutation({
  args: {
    id: v.id("registrations"),
    title: v.string(),
    subtitle: v.optional(v.string()),
    url: v.string(),
    category: v.optional(v.string()),
    cost: v.optional(v.string()),
    isActive: v.boolean(),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteRegistration = mutation({
  args: { id: v.id("registrations") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
