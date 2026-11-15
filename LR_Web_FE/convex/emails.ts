import { v } from "convex/values";
import { internalAction } from "./_generated/server";

export const sendInquiryEmails = internalAction({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
    message: v.string(),
  },
  handler: async (_ctx, args) => {
    const apiKey = process.env.RESEND_API_KEY;
    const recipientEmail = process.env.NOTIFICATION_EMAIL || "info@lr-dance.cz";

    if (!apiKey) {
      console.warn("RESEND_API_KEY není nastavena v Convex Dashboardu. E-mail nebyl odeslán přes Resend.");
      return { skipped: true, reason: "missing_api_key" };
    }

    try {
      // 1. Notifikace pro vedení klubu
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LR-Dance Web <onboarding@resend.dev>",
          to: [recipientEmail],
          subject: `Nová zpráva z webu: ${args.name}`,
          html: `
            <h2>Nová zpráva z webu LR-Dance</h2>
            <p><strong>Jméno:</strong> ${escapeHtml(args.name)}</p>
            <p><strong>E-mail:</strong> ${escapeHtml(args.email)}</p>
            <p><strong>Telefon:</strong> ${args.phone ? escapeHtml(args.phone) : "Neuveden"}</p>
            <hr />
            <p><strong>Zpráva:</strong></p>
            <p style="white-space: pre-wrap;">${escapeHtml(args.message)}</p>
          `,
        }),
      });

      // 2. Automatické potvrzení pro klienta
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LR-Dance <onboarding@resend.dev>",
          to: [args.email],
          subject: "Potvrzení přijetí Vaší zprávy – LR DANCE TEAM",
          html: `
            <h2>Dobrý den, ${escapeHtml(args.name)},</h2>
            <p>děkujeme za Vaši zprávu. Zprávu jsme v pořádku přijali a brzy se Vám ozveme zpět.</p>
            <hr />
            <p><strong>Shrnutí Vašeho dotazu:</strong></p>
            <p style="white-space: pre-wrap;">${escapeHtml(args.message)}</p>
            <br />
            <p>S pozdravem,<br />Tým LR DANCE TEAM & Taneční škola CARMEN<br /><a href="https://lr-dance.cz">lr-dance.cz</a></p>
          `,
        }),
      });

      return { status: "sent" };
    } catch (error) {
      console.error("Chyba při odesílání e-mailů přes Resend:", error);
      return { status: "error", error: String(error) };
    }
  },
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
