import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});

export const loginUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const inputIdentifier = args.email.trim().toLowerCase();
    const password = args.password;

    if (!inputIdentifier || !password) {
      return { status: "error", message: "Zadejte přihlašovací jméno i heslo." };
    }

    // 1. Získání přihlašovacích údajů z Convex Environment Variables
    // Administrátor (ADMIN_USERNAME / ADMIN_EMAIL a ADMIN_PASSWORD)
    const adminUser = (
      process.env.ADMIN_USERNAME ||
      process.env.ADMIN_EMAIL ||
      process.env.ADMIN_USER ||
      "admin"
    ).trim().toLowerCase();
    const adminPass = process.env.ADMIN_PASSWORD || process.env.ADMIN_PASS || "lrdance2026";

    // Majitel / Owner (OWNER_USERNAME / OWNER_EMAIL a OWNER_PASSWORD)
    const ownerUser = (
      process.env.OWNER_USERNAME ||
      process.env.OWNER_EMAIL ||
      process.env.OWNER_USER ||
      "owner"
    ).trim().toLowerCase();
    const ownerPass = process.env.OWNER_PASSWORD || process.env.OWNER_PASS || "carmen2026";

    // Povolené identifikátory pro admina (přihlašovací jméno z env + klubové aliasy)
    const adminAliases = new Set([
      adminUser,
      "admin",
      "lrdanceostrava@gmail.com",
      "admin@lr-dance.cz",
    ]);

    // Povolené identifikátory pro majitele (přihlašovací jméno z env + aliasy)
    const ownerAliases = new Set([
      ownerUser,
      "owner",
      "majitel",
      "carmen@lr-dance.cz",
    ]);

    const isClubAdmin = adminAliases.has(inputIdentifier);
    const isOwner = ownerAliases.has(inputIdentifier);

    // 2. Klubový účet administrátora
    if (isClubAdmin) {
      if (password !== adminPass) {
        return { status: "error", message: "Neplatné heslo administrátora." };
      }

      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", inputIdentifier))
        .first();

      if (!user) {
        await ctx.db.insert("users", {
          name: "Administrátor LR Dance",
          email: inputIdentifier,
          role: "admin",
        });
      }

      const token = `convex_auth_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      return {
        status: "success",
        token,
        role: "admin",
      };
    }

    // 3. Účet majitele (owner)
    if (isOwner) {
      if (password !== ownerPass) {
        return { status: "error", message: "Neplatné heslo majitele." };
      }

      const user = await ctx.db
        .query("users")
        .withIndex("email", (q) => q.eq("email", inputIdentifier))
        .first();

      if (!user) {
        await ctx.db.insert("users", {
          name: "Majitel TŠ Carmen",
          email: inputIdentifier,
          role: "owner",
        });
      }

      const token = `convex_auth_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      return {
        status: "success",
        token,
        role: "owner",
      };
    }

    return {
      status: "error",
      message: "Neplatné přihlašovací jméno nebo heslo.",
    };
  },
});
