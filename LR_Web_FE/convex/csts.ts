import { v } from "convex/values";
import { action } from "./_generated/server";

export const fetchAthletePreview = action({
  args: { idt: v.number() },
  handler: async (_ctx, args) => {
    if (args.idt <= 0) return null;

    const url = `https://www.csts.cz/api/1/athletes/${args.idt}`;

    try {
      const res = await fetch(url, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "LR-Dance-Web/2.0 (+https://lr-dance.cz)",
        },
      });

      if (!res.ok) {
        return { error: `ČSTS API odpovědělo kódem ${res.status}` };
      }

      const json = await res.json();
      return json;
    } catch (err) {
      return { error: `Nepodařilo se kontaktovat ČSTS: ${String(err)}` };
    }
  },
});
