import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // Uživatelské role a profily rozšiřující authTables
  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("owner")),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
  }).index("email", ["email"]),

  // Aktuality a články
  news: defineTable({
    title: v.string(),
    slug: v.optional(v.string()),
    perex: v.string(),
    content: v.string(),
    image: v.optional(v.string()),
    publishedAt: v.string(),
    isPublished: v.boolean(),
  }).index("by_published", ["isPublished", "publishedAt"]),

  // Profily trenérů
  trainers: defineTable({
    name: v.string(),
    role: v.string(),
    bio: v.string(),
    image: v.optional(v.string()),
    category_lat: v.optional(v.boolean()),
    category_stt: v.optional(v.boolean()),
    order: v.number(),
    isActive: v.boolean(),
  }).index("by_order", ["isActive", "order"]),

  // Taneční páry a sólisté
  dancers: defineTable({
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
  }).index("by_type", ["type", "isActive"]),

  // Výsledky soutěží
  competition_results: defineTable({
    competitionName: v.string(),
    date: v.string(),
    location: v.optional(v.string()),
    category: v.string(),
    dancerNames: v.string(),
    placement: v.string(),
    points: v.optional(v.string()),
    finals: v.optional(v.boolean()),
    createdAt: v.optional(v.string()),
  }).index("by_date", ["date"]),

  // Harmonogram tréninků a sálů
  training_schedules: defineTable({
    locationName: v.optional(v.string()),
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
  }),

  // Kalendář akcí a soustředění
  calendar_events: defineTable({
    title: v.string(),
    date: v.string(),
    time: v.optional(v.string()),
    location: v.optional(v.string()),
    description: v.optional(v.string()),
    type: v.optional(v.string()),
  }).index("by_date", ["date"]),

  // Editovatelný obsah stránek (carmen, partneři, lokace atd.)
  content_pages: defineTable({
    pageKey: v.string(),
    data: v.any(),
    updatedAt: v.string(),
  }).index("by_pageKey", ["pageKey"]),

  // Kontaktní dotazy a poptávky (CMS Inbox s nezávislým čtením/připnutím)
  inquiries: defineTable({
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.string(),
    page: v.optional(v.string()),
    createdAt: v.string(),
    adminRead: v.boolean(),
    ownerRead: v.boolean(),
    adminPinned: v.boolean(),
    ownerPinned: v.boolean(),
  }).index("by_created", ["createdAt"]),

  // Přihlášky a deeplinky na is.pohodlne.info
  registrations: defineTable({
    title: v.string(),
    subtitle: v.optional(v.string()),
    url: v.string(),
    category: v.optional(v.string()),
    cost: v.optional(v.string()),
    isActive: v.boolean(),
    order: v.optional(v.number()),
  }),
});
