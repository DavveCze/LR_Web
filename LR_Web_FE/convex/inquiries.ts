import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const submitInquiry = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.string(),
    page: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // 1. Zápis do databáze (CMS Inbox)
    const inquiryId = await ctx.db.insert("inquiries", {
      name: args.name,
      email: args.email,
      phone: args.phone,
      message: args.message,
      page: args.page || "web",
      createdAt: new Date().toISOString(),
      adminRead: false,
      ownerRead: false,
      adminPinned: false,
      ownerPinned: false,
    });

    // 2. Asynchronní odeslání transakčních mailů přes Resend action
    try {
      await ctx.scheduler.runAfter(0, internal.emails.sendInquiryEmails, {
        name: args.name,
        email: args.email,
        phone: args.phone,
        message: args.message,
      });
    } catch (e) {
      console.warn("Scheduler failed (email sending skipped in dev or missing action):", e);
    }

    return { status: "success", inquiryId };
  },
});

export const listInquiries = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("inquiries").order("desc").collect();
  },
});

export const markAsRead = mutation({
  args: {
    id: v.id("inquiries"),
    role: v.union(v.literal("admin"), v.literal("owner")),
    isRead: v.boolean(),
  },
  handler: async (ctx, args) => {
    if (args.role === "admin") {
      await ctx.db.patch(args.id, { adminRead: args.isRead });
    } else {
      await ctx.db.patch(args.id, { ownerRead: args.isRead });
    }
  },
});

export const togglePin = mutation({
  args: {
    id: v.id("inquiries"),
    role: v.union(v.literal("admin"), v.literal("owner")),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db.get(args.id);
    if (!item) return;

    if (args.role === "admin") {
      await ctx.db.patch(args.id, { adminPinned: !item.adminPinned });
    } else {
      await ctx.db.patch(args.id, { ownerPinned: !item.ownerPinned });
    }
  },
});

export const deleteInquiry = mutation({
  args: { id: v.id("inquiries") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
