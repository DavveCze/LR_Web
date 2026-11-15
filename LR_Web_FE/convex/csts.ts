import { v } from "convex/values";
import { action } from "./_generated/server";

function normalizeCategory(cls?: string | null): string | null {
  if (!cls) return null;
  const clean = cls.trim().toUpperCase();
  return ["M", "A", "B", "C", "D", "E"].includes(clean) ? clean : null;
}

export const fetchAthletePreview = action({
  args: { idt: v.number() },
  handler: async (_ctx, args) => {
    if (args.idt <= 0) {
      return { status: "error", message: "Neplatné ČSTS IDT." };
    }

    const url = `https://www.csts.cz/api/1/athletes/${args.idt}`;

    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "LR-Dance-Web/2.0 (+https://lr-dance.cz)",
        },
      });

      if (!res.ok) {
        return {
          status: "error",
          message: `ČSTS API odpovědělo kódem ${res.status}. Tanečník nebyl nalezen.`,
        };
      }

      const json = await res.json().catch(() => null);
      if (!json || !Array.isArray(json.collection) || !json.collection[0]) {
        return {
          status: "error",
          message: `Tanečník s IDT ${args.idt} nebyl v ČSTS nalezen.`,
        };
      }

      const raw = json.collection[0];
      const fullName = (raw.name || "").trim();
      const parts = fullName.split(/\s+/);
      const surname = parts.length > 1 ? parts.pop() || "" : "";
      const firstName = parts.join(" ") || fullName;

      let lat = raw.lat;
      let stt = raw.stt;

      if (!lat && Array.isArray(raw.rankingPoints)) {
        lat = raw.rankingPoints.find((rp: any) => rp?.discipline === "Latin");
      }
      if (!stt && Array.isArray(raw.rankingPoints)) {
        stt = raw.rankingPoints.find((rp: any) => rp?.discipline === "Standard");
      }

      const catLat = normalizeCategory(lat?.class || lat?.personalClass);
      const pointsLat = Number(lat?.points ?? lat?.personalPoints ?? 0);
      const finalsLat = Number(
        (lat?.domesticFinaleCount ?? 0) + (lat?.foreignFinaleCount ?? 0)
      );
      const partnerLatName = lat?.partner ? String(lat.partner).trim() : null;
      const partnerLatIdt = lat?.partnerIdt ? Number(lat.partnerIdt) : null;

      const catStt = normalizeCategory(stt?.class || stt?.personalClass);
      const pointsStt = Number(stt?.points ?? stt?.personalPoints ?? 0);
      const finalsStt = Number(
        (stt?.domesticFinaleCount ?? 0) + (stt?.foreignFinaleCount ?? 0)
      );
      const partnerSttName = stt?.partner ? String(stt.partner).trim() : null;
      const partnerSttIdt = stt?.partnerIdt ? Number(stt.partnerIdt) : null;

      return {
        status: "success",
        data: {
          csts_idt: Number(raw.idt || args.idt),
          full_name: fullName,
          name: firstName,
          surname: surname,
          sex: raw.sex || null,
          category_lat: catLat,
          points_lat: pointsLat,
          finals_lat: finalsLat,
          partner_lat_name: partnerLatName,
          partner_lat_idt: partnerLatIdt,
          category_stt: catStt,
          points_stt: pointsStt,
          finals_stt: finalsStt,
          partner_stt_name: partnerSttName,
          partner_stt_idt: partnerSttIdt,
          suggested_partner_idt: partnerLatIdt || partnerSttIdt || null,
          suggested_partner_name: partnerLatName || partnerSttName || null,
        },
      };
    } catch (err) {
      return {
        status: "error",
        message: `Nepodařilo se kontaktovat ČSTS: ${err instanceof Error ? err.message : String(err)}`,
      };
    }
  },
});
