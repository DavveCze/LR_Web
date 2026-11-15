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
    const email = args.email.trim().toLowerCase();
    const password = args.password;

    if (!email || !password) {
      return { status: "error", message: "Zadejte e-mail i heslo." };
    }

    // 1. Zkontrolujeme, zda uživatel existuje v tabulce users
    const user = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", email))
      .first();

    const isClubAdmin = email === "lrdanceostrava@gmail.com";
    const isOwner = email.includes("majitel") || email === "carmen@lr-dance.cz";

    const expectedAdminPass = process.env.ADMIN_PASSWORD || "lrdance2026";
    const expectedOwnerPass = process.env.OWNER_PASSWORD || "carmen2026";

    // 2. Klubový účet – striktní ověření hesla
    if (isClubAdmin) {
      if (password !== expectedAdminPass) {
        return { status: "error", message: "Neplatné heslo administrátora." };
      }

      if (!user) {
        await ctx.db.insert("users", {
          name: "Administrátor LR Dance",
          email,
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

    if (isOwner) {
      if (password !== expectedOwnerPass) {
        return { status: "error", message: "Neplatné heslo majitele." };
      }

      if (!user) {
        await ctx.db.insert("users", {
          name: "Majitel TŠ Carmen",
          email,
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
