import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listSchedule = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("training_schedules").collect();
  },
});

export const createScheduleItem = mutation({
  args: {
    locationName: v.string(),
    dayOfWeek: v.string(),
    timeRange: v.string(),
    groupName: v.string(),
    trainerName: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("training_schedules", args);
  },
});

export const updateScheduleItem = mutation({
  args: {
    id: v.id("training_schedules"),
    locationName: v.string(),
    dayOfWeek: v.string(),
    timeRange: v.string(),
    groupName: v.string(),
    trainerName: v.optional(v.string()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, data);
  },
});

export const deleteScheduleItem = mutation({
  args: { id: v.id("training_schedules") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
