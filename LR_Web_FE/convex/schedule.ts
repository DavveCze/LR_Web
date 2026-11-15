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
    locationName: v.optional(v.string()),
    location_name: v.optional(v.string()),
    locationId: v.optional(v.union(v.number(), v.string())),
    location_id: v.optional(v.union(v.number(), v.string())),
    dayOfWeek: v.optional(v.string()),
    day_of_week: v.optional(v.string()),
    timeRange: v.optional(v.string()),
    start_time: v.optional(v.string()),
    end_time: v.optional(v.string()),
    title: v.optional(v.string()),
    groupName: v.optional(v.string()),
    group_type: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    trainerName: v.optional(v.string()),
    trainer_name: v.optional(v.string()),
    trainer_id: v.optional(v.union(v.number(), v.string())),
    block_type: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    order: v.optional(v.number()),
    display_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("training_schedules", args);
  },
});

export const updateScheduleItem = mutation({
  args: {
    id: v.id("training_schedules"),
    locationName: v.optional(v.string()),
    location_name: v.optional(v.string()),
    locationId: v.optional(v.union(v.number(), v.string())),
    location_id: v.optional(v.union(v.number(), v.string())),
    dayOfWeek: v.optional(v.string()),
    day_of_week: v.optional(v.string()),
    timeRange: v.optional(v.string()),
    start_time: v.optional(v.string()),
    end_time: v.optional(v.string()),
    title: v.optional(v.string()),
    groupName: v.optional(v.string()),
    group_type: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    trainerName: v.optional(v.string()),
    trainer_name: v.optional(v.string()),
    trainer_id: v.optional(v.union(v.number(), v.string())),
    block_type: v.optional(v.string()),
    is_active: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    order: v.optional(v.number()),
    display_order: v.optional(v.number()),
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
