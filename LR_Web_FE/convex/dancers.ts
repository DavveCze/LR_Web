import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listAllAdminData = query({
  args: {},
  handler: async (ctx) => {
    const rawDancers = await ctx.db.query("dancers").collect();
    const rawPairs = await ctx.db.query("dance_pairs").collect();
    const rawResults = await ctx.db
      .query("competition_results")
      .withIndex("by_date")
      .order("desc")
      .collect();

    const dancers = rawDancers.map((d: any) => ({
      idt: d._id || d.idt,
      name: d.name || "",
      surname: d.surname || "",
      sex: d.sex || "M",
      category_lat: d.category_lat || null,
      category_stt: d.category_stt || null,
      points_lat: d.points_lat ?? 0,
      finals_lat: d.finals_lat ?? 0,
      points_stt: d.points_stt ?? 0,
      finals_stt: d.finals_stt ?? 0,
      csts_idt: d.csts_idt ?? null,
      csts_synced_at: d.csts_synced_at ?? null,
      is_active: d.is_active ?? d.isActive ?? true,
      is_public: d.is_public ?? true,
      display_order: d.display_order ?? d.order ?? 0,
    }));

    const pairs = rawPairs.map((p: any) => ({
      pair_id: p._id || p.pair_id,
      idt1: p.idt1,
      idt2: p.idt2,
      category_lat: p.category_lat || null,
      category_stt: p.category_stt || null,
      points: p.points ?? 0,
      finals: Boolean(p.finals),
      points_lat: p.points_lat ?? 0,
      finals_lat: p.finals_lat ?? 0,
      points_stt: p.points_stt ?? 0,
      finals_stt: p.finals_stt ?? 0,
      csts_synced_at: p.csts_synced_at ?? null,
      is_active: p.is_active ?? p.isActive ?? true,
      is_public: p.is_public ?? true,
      display_order: p.display_order ?? p.order ?? 0,
      dancer1_name: p.dancer1_name || "",
      dancer1_surname: p.dancer1_surname || "",
      dancer1_sex: p.dancer1_sex || "M",
      dancer2_name: p.dancer2_name || null,
      dancer2_surname: p.dancer2_surname || null,
      dancer2_sex: p.dancer2_sex || null,
    }));

    const results = rawResults.map((r: any) => ({
      id: r._id || r.id,
      pair_id: r.pair_id ?? 0,
      competition_name: r.competition_name || r.competitionName || "",
      date: r.date || "",
      location: r.location || "",
      placement: r.placement || "",
      created_at: r.createdAt || r.created_at || null,
      dancer1: r.dancer1 || r.dancerNames || "",
      dancer2: r.dancer2 || null,
    }));

    return { dancers, pairs, results };
  },
});

export const listPairs = query({
  args: {},
  handler: async (ctx) => {
    const rawPairs = await ctx.db.query("dance_pairs").collect();
    return rawPairs
      .filter((p: any) => (p.is_active ?? p.isActive ?? true) && (p.is_public ?? true))
      .map((p: any) => ({
        pair_id: p._id || p.pair_id,
        is_solo: !p.dancer2_name,
        dancer1: {
          id: p.idt1 ?? 1,
          name: p.dancer1_name || "",
          surname: p.dancer1_surname || "",
        },
        dancer2: p.dancer2_name
          ? {
              id: p.idt2 ?? 2,
              name: p.dancer2_name,
              surname: p.dancer2_surname || "",
            }
          : null,
        category_lat: p.category_lat || null,
        category_stt: p.category_stt || null,
        points: p.points ?? 0,
        finals: Boolean(p.finals),
        points_lat: p.points_lat,
        finals_lat: p.finals_lat,
        points_stt: p.points_stt,
        finals_stt: p.finals_stt,
      }));
  },
});

export const listSingles = query({
  args: {},
  handler: async (ctx) => {
    const dancers = await ctx.db.query("dancers").collect();
    const pairs = await ctx.db.query("dance_pairs").collect();
    const pairedNames = new Set(
      pairs.flatMap((p: any) => [
        `${p.dancer1_name} ${p.dancer1_surname}`.trim().toLowerCase(),
        p.dancer2_name ? `${p.dancer2_name} ${p.dancer2_surname}`.trim().toLowerCase() : "",
      ])
    );

    return dancers
      .filter((d: any) => {
        const active = d.is_active ?? d.isActive ?? true;
        const pub = d.is_public ?? true;
        const fullName = `${d.name} ${d.surname}`.trim().toLowerCase();
        return active && pub && !pairedNames.has(fullName);
      })
      .map((d: any) => ({
        idt: d._id || d.idt,
        name: d.name || "",
        surname: d.surname || "",
        category_lat: d.category_lat || null,
        category_stt: d.category_stt || null,
        points_lat: d.points_lat,
        finals_lat: d.finals_lat,
        points_stt: d.points_stt,
        finals_stt: d.finals_stt,
      }));
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
    name: v.string(),
    surname: v.optional(v.string()),
    sex: v.optional(v.union(v.literal("M"), v.literal("F"))),
    category_lat: v.optional(v.string()),
    category_stt: v.optional(v.string()),
    points_lat: v.optional(v.number()),
    finals_lat: v.optional(v.number()),
    points_stt: v.optional(v.number()),
    finals_stt: v.optional(v.number()),
    csts_idt: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    is_public: v.optional(v.boolean()),
    display_order: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dancers", {
      ...args,
      is_active: args.is_active ?? args.isActive ?? true,
      isActive: args.isActive ?? args.is_active ?? true,
      is_public: args.is_public ?? true,
      display_order: args.display_order ?? args.order ?? 0,
      csts_synced_at: new Date().toISOString(),
    });
  },
});

export const updateDancer = mutation({
  args: {
    id: v.id("dancers"),
    name: v.string(),
    surname: v.optional(v.string()),
    sex: v.optional(v.union(v.literal("M"), v.literal("F"))),
    category_lat: v.optional(v.string()),
    category_stt: v.optional(v.string()),
    points_lat: v.optional(v.number()),
    finals_lat: v.optional(v.number()),
    points_stt: v.optional(v.number()),
    finals_stt: v.optional(v.number()),
    csts_idt: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
    isActive: v.optional(v.boolean()),
    is_public: v.optional(v.boolean()),
    display_order: v.optional(v.number()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, {
      ...data,
      is_active: data.is_active ?? data.isActive,
      isActive: data.isActive ?? data.is_active,
      display_order: data.display_order ?? data.order,
      csts_synced_at: new Date().toISOString(),
    });
  },
});

export const deleteDancer = mutation({
  args: { id: v.id("dancers") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const createPair = mutation({
  args: {
    idt1: v.optional(v.union(v.number(), v.string())),
    idt2: v.optional(v.union(v.number(), v.string())),
    dancer1_name: v.string(),
    dancer1_surname: v.string(),
    dancer1_sex: v.optional(v.string()),
    dancer2_name: v.optional(v.string()),
    dancer2_surname: v.optional(v.string()),
    dancer2_sex: v.optional(v.string()),
    category_lat: v.optional(v.string()),
    category_stt: v.optional(v.string()),
    points: v.optional(v.number()),
    finals: v.optional(v.boolean()),
    points_lat: v.optional(v.number()),
    finals_lat: v.optional(v.number()),
    points_stt: v.optional(v.number()),
    finals_stt: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
    is_public: v.optional(v.boolean()),
    display_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dance_pairs", {
      ...args,
      is_active: args.is_active ?? true,
      is_public: args.is_public ?? true,
      display_order: args.display_order ?? 0,
      csts_synced_at: new Date().toISOString(),
    });
  },
});

export const updatePair = mutation({
  args: {
    id: v.id("dance_pairs"),
    idt1: v.optional(v.union(v.number(), v.string())),
    idt2: v.optional(v.union(v.number(), v.string())),
    dancer1_name: v.string(),
    dancer1_surname: v.string(),
    dancer1_sex: v.optional(v.string()),
    dancer2_name: v.optional(v.string()),
    dancer2_surname: v.optional(v.string()),
    dancer2_sex: v.optional(v.string()),
    category_lat: v.optional(v.string()),
    category_stt: v.optional(v.string()),
    points: v.optional(v.number()),
    finals: v.optional(v.boolean()),
    points_lat: v.optional(v.number()),
    finals_lat: v.optional(v.number()),
    points_stt: v.optional(v.number()),
    finals_stt: v.optional(v.number()),
    is_active: v.optional(v.boolean()),
    is_public: v.optional(v.boolean()),
    display_order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...data } = args;
    await ctx.db.patch(id, {
      ...data,
      csts_synced_at: new Date().toISOString(),
    });
  },
});

export const deletePair = mutation({
  args: { id: v.id("dance_pairs") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Import tanečníka + případného partnera a vytvoření páru přímo v Convexu
export const importFromCsts = mutation({
  args: {
    athlete: v.any(),
    linkPartner: v.boolean(),
  },
  handler: async (ctx, args) => {
    const a = args.athlete;
    if (!a || !a.name) {
      throw new Error("Neplatná data tanečníka.");
    }

    // 1. Zjistit, zda tanečník už existuje (dle csts_idt nebo jména a příjmení)
    const existing = await ctx.db.query("dancers").collect();
    let dancer = existing.find(
      (d) =>
        (a.csts_idt && d.csts_idt === a.csts_idt) ||
        (d.name.toLowerCase() === a.name.toLowerCase() &&
          (d.surname || "").toLowerCase() === (a.surname || "").toLowerCase())
    );

    const dancerPayload = {
      name: a.name,
      surname: a.surname || "",
      sex: a.sex || "M",
      category_lat: a.category_lat || undefined,
      category_stt: a.category_stt || undefined,
      points_lat: a.points_lat ?? 0,
      finals_lat: a.finals_lat ?? 0,
      points_stt: a.points_stt ?? 0,
      finals_stt: a.finals_stt ?? 0,
      csts_idt: a.csts_idt ? Number(a.csts_idt) : undefined,
      csts_synced_at: new Date().toISOString(),
      is_active: true,
      isActive: true,
      is_public: true,
      display_order: 0,
    };

    let dancerId: string;
    if (dancer) {
      dancerId = dancer._id;
      await ctx.db.patch(dancer._id, dancerPayload);
    } else {
      dancerId = await ctx.db.insert("dancers", dancerPayload);
    }

    // 2. Pokud máme partnera a linkPartner je zapnuto
    let pairCreated = false;
    if (args.linkPartner) {
      const partnerName = a.partner_lat_name || a.partner_stt_name;
      const partnerIdt = a.partner_lat_idt || a.partner_stt_idt;

      if (partnerName) {
        const parts = partnerName.trim().split(/\s+/);
        const pSurname = parts.length > 1 ? parts.pop() || "" : "";
        const pFirstName = parts.join(" ") || partnerName;

        let partnerDancer = existing.find(
          (d) =>
            (partnerIdt && d.csts_idt === partnerIdt) ||
            (d.name.toLowerCase() === pFirstName.toLowerCase() &&
              (d.surname || "").toLowerCase() === pSurname.toLowerCase())
        );

        const partnerSex = a.sex === "M" ? "F" : "M";

        let partnerDancerId: string;
        if (partnerDancer) {
          partnerDancerId = partnerDancer._id;
        } else {
          partnerDancerId = await ctx.db.insert("dancers", {
            name: pFirstName,
            surname: pSurname,
            sex: partnerSex,
            csts_idt: partnerIdt || undefined,
            category_lat: a.category_lat || undefined,
            category_stt: a.category_stt || undefined,
            points_lat: a.points_lat ?? 0,
            finals_lat: a.finals_lat ?? 0,
            points_stt: a.points_stt ?? 0,
            finals_stt: a.finals_stt ?? 0,
            csts_synced_at: new Date().toISOString(),
            is_active: true,
            isActive: true,
            is_public: true,
            display_order: 0,
          });
        }

        // Vytvoříme pár: partner (M) je dancer1, partnerka (F) je dancer2
        const isMan = a.sex === "M";
        const d1Name = isMan ? a.name : pFirstName;
        const d1Surname = isMan ? a.surname || "" : pSurname;
        const d1Sex = "M";
        const d1Id = isMan ? dancerId : partnerDancerId;

        const d2Name = isMan ? pFirstName : a.name;
        const d2Surname = isMan ? pSurname : a.surname || "";
        const d2Sex = "F";
        const d2Id = isMan ? partnerDancerId : dancerId;

        // Zkontrolujeme, zda pár už neexistuje
        const existingPairs = await ctx.db.query("dance_pairs").collect();
        const existingPair = existingPairs.find(
          (p) =>
            p.dancer1_name.toLowerCase() === d1Name.toLowerCase() &&
            p.dancer1_surname.toLowerCase() === d1Surname.toLowerCase() &&
            (p.dancer2_name || "").toLowerCase() === d2Name.toLowerCase() &&
            (p.dancer2_surname || "").toLowerCase() === d2Surname.toLowerCase()
        );

        const pairPayload = {
          idt1: d1Id,
          idt2: d2Id,
          dancer1_name: d1Name,
          dancer1_surname: d1Surname,
          dancer1_sex: d1Sex,
          dancer2_name: d2Name,
          dancer2_surname: d2Surname,
          dancer2_sex: d2Sex,
          category_lat: a.category_lat || undefined,
          category_stt: a.category_stt || undefined,
          points_lat: a.points_lat ?? 0,
          finals_lat: a.finals_lat ?? 0,
          points_stt: a.points_stt ?? 0,
          finals_stt: a.finals_stt ?? 0,
          points: (a.points_lat ?? 0) + (a.points_stt ?? 0),
          finals: Boolean((a.finals_lat ?? 0) > 0 || (a.finals_stt ?? 0) > 0),
          is_active: true,
          is_public: true,
          display_order: 0,
          csts_synced_at: new Date().toISOString(),
        };

        if (existingPair) {
          await ctx.db.patch(existingPair._id, pairPayload);
        } else {
          await ctx.db.insert("dance_pairs", pairPayload);
        }
        pairCreated = true;
      }
    }

    return {
      success: true,
      dancerId,
      pairCreated,
      message: `Tanečník ${a.name} ${a.surname || ""} byl úspěšně uložen${pairCreated ? " a pár byl propojen" : ""}.`,
    };
  },
});

// Soutěžní výsledky
export const listResults = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const q = ctx.db.query("competition_results").withIndex("by_date").order("desc");
    const items = args.limit ? await q.take(args.limit) : await q.collect();
    return items.map((r: any) => ({
      id: r._id || r.id,
      pair_id: r.pair_id ?? 0,
      competition_name: r.competition_name || r.competitionName || "",
      date: r.date || "",
      location: r.location || "",
      placement: r.placement || "",
      created_at: r.createdAt || r.created_at || null,
      dancer1: r.dancer1 || r.dancerNames || "",
      dancer2: r.dancer2 || null,
    }));
  },
});

export const createResult = mutation({
  args: {
    competition_name: v.optional(v.string()),
    competitionName: v.optional(v.string()),
    date: v.string(),
    location: v.optional(v.string()),
    category: v.optional(v.string()),
    dancer1: v.optional(v.string()),
    dancer2: v.optional(v.string()),
    dancerNames: v.optional(v.string()),
    placement: v.string(),
    points: v.optional(v.string()),
    finals: v.optional(v.boolean()),
    pair_id: v.optional(v.union(v.number(), v.string())),
  },
  handler: async (ctx, args) => {
    const compName = args.competition_name || args.competitionName || "";
    return await ctx.db.insert("competition_results", {
      ...args,
      competitionName: compName,
      competition_name: compName,
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
