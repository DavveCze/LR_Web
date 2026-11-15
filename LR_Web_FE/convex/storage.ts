import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

export const saveImageRecord = mutation({
  args: {
    folder: v.string(),
    baseName: v.string(),
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    const url = await ctx.storage.getUrl(args.storageId);
    const previewUrl = url || "";
    const id = await ctx.db.insert("images", {
      folder: args.folder,
      baseName: args.baseName,
      storageId: args.storageId,
      previewUrl,
      url: previewUrl,
      createdAt: new Date().toISOString(),
    });
    return { id, url: previewUrl };
  },
});

export const listImages = query({
  args: { folder: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("images").collect();
    if (args.folder && args.folder !== "All") {
      return all.filter((img) => img.folder === args.folder);
    }
    return all;
  },
});

export const deleteImage = mutation({
  args: {
    folder: v.string(),
    baseName: v.string(),
  },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("images")
      .withIndex("by_folder", (q) => q.eq("folder", args.folder))
      .filter((q) => q.eq(q.field("baseName"), args.baseName))
      .collect();

    for (const match of matches) {
      if (match.storageId) {
        try {
          await ctx.storage.delete(match.storageId);
        } catch {
          // ignore
        }
      }
      await ctx.db.delete(match._id);
    }
  },
});

export const renameImage = mutation({
  args: {
    folder: v.string(),
    oldBaseName: v.string(),
    newBaseName: v.string(),
  },
  handler: async (ctx, args) => {
    const matches = await ctx.db
      .query("images")
      .withIndex("by_folder", (q) => q.eq("folder", args.folder))
      .filter((q) => q.eq(q.field("baseName"), args.oldBaseName))
      .collect();

    for (const match of matches) {
      await ctx.db.patch(match._id, { baseName: args.newBaseName });
    }
  },
});
