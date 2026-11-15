import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listEvents = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("calendar_events").withIndex("by_date").order("asc").collect();
  },
});

export const createEvent = mutation({
  args: {
    title: v.string(),
    date: v.string(),
    time: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("calendar_events", args);
  },
});

export const updateEvent = mutation({
  args: {
    id: v.id("calendar_events"),
    title: v.string(),
    date: v.string(),
    time: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteEvent = mutation({
  args: { id: v.id("calendar_events") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
