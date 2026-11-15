import { mutation } from "./_generated/server";

export const seedInitialData = mutation({
  args: {},
  handler: async (ctx) => {
    // 1. Zkontrolujeme a naseedujeme content_pages
    const existingPartners = await ctx.db
      .query("content_pages")
      .withIndex("by_pageKey", (q) => q.eq("pageKey", "partners"))
      .first();

    if (!existingPartners) {
      await ctx.db.insert("content_pages", {
        pageKey: "partners",
        updatedAt: new Date().toISOString(),
        data: {
          title: "PARTNEŘI",
          mainLogos: [
            {
              id: "ostrava",
              name: "Statutární město Ostrava",
              logo: "/assets/imgs/partners/ostrava_logo_1.webp",
              url: "https://ostrava.cz",
              position: "right-top",
            },
            {
              id: "nsa",
              name: "Národní sportovní agentura",
              logo: "/assets/imgs/partners/nsa_logo_1.webp",
              url: "https://nsa.gov.cz",
              position: "right-bottom",
            },
            {
              id: "csts",
              name: "ČSTS",
              logo: "/assets/imgs/partners/csts_logo_1.webp",
              url: "https://csts.cz",
              position: "left",
            },
          ],
          notices: [
            {
              id: "nsa-dotace",
              logo: "/assets/imgs/partners/nsa_logo_1.webp",
              title: "Podpora Národní sportovní agentury",
              paragraphs: [
                "Spolek LR Cosmetic dance team, z. s. obdržel v roce 2026 dotaci od Národní sportovní agentury ve výši 248 400 Kč.",
                "Dotace je využívána na podporu sportovní činnosti a rozvoj tanečního sportu.",
              ],
              thanksText: "Za poskytnutou podporu děkujeme.",
            },
          ],
        },
      });
    }

    const existingCarmen = await ctx.db
      .query("content_pages")
      .withIndex("by_pageKey", (q) => q.eq("pageKey", "carmen"))
      .first();

    if (!existingCarmen) {
      await ctx.db.insert("content_pages", {
        pageKey: "carmen",
        updatedAt: new Date().toISOString(),
        data: {
          overview: {
            title: "TŠ CARMEN",
            bullets: [
              "Taneční školu Carmen založila Lucie Skopalíková v roce 2000. Zaměřujeme se na práci s dětmi v mateřských a základních školách.",
              "Nabízíme bohaté a kvalitní zkušenosti v oblasti výuky tance, rozvoj pohybu a koordinace dítěte, spoustu zážitků, legrace a her, mnohaletou praxi s dětmi. Výuka probíhá přímo ve školce či škole, takže nemusíte nikam dojíždět. Závěr kurzu je ukončen velkolepou taneční akademií v kulturním domě Akord. Možnost pokračování ve sportovním klubu LR Dance team Ostrava.",
              "Během roku pořádáme další aktivity pro děti jako jsou např. víkendové pobyty, o prázdninách - spací tábor a také příměstské tábory.",
            ],
            facebookUrl: "https://www.facebook.com/groups/572718036195543",
            galleryUrl: "/carmen/fotogalerie",
            slideshow: [
              { src: "/assets/imgs/carmen/carmen_tanec_1.webp", alt: "Taneční vystoupení Carmen" },
              { src: "/assets/imgs/carmen/carmen_tanec1_1.webp", alt: "Dětský tanec Carmen" },
              { src: "/assets/imgs/carmen/carmen_tanec3_1.webp", alt: "Taneční lekce Carmen" },
              { src: "/assets/imgs/carmen/carmen_skupina_1.webp", alt: "Společné foto dětí Carmen" },
            ],
          },
          tabory: {
            title: "TÁBORY",
            paragraphs: [
              "Naše tábory jsou spojením tradičních a moderních táborů, které se svým osvědčeným týmem vedoucích s mnohaletou táborovou praxí tvoří nezapomenutelné prázdninové dny. Tábory pro děti pořádáme již od roku 2004.",
              "Zárukou kvality našich táborů jsou spokojené děti, které se každoročně účastní našich letních táborů.",
            ],
          },
          tabor: {
            title: "SPACÍ TÁBOR",
            paragraphs: [
              "Letní spací tábor probíhá v RK Budoucnost v krásném prostředí Beskyd (Nová Ves – Frýdlant nad Ostravicí).",
              "Děti čeká celotáborová hra, tréninky v tanečním sále, in-line dráha, diskotéky a koupání.",
            ],
            location: "RK Budoucnost, Frýdlant n. O.",
            age: "od 6 do 17 let",
            food: "Plná penze 5x denně + pitný režim",
            poster: "/assets/imgs/downloaded/plakat_carmen_spaci_tabor_1.webp",
            registrationUrl: "https://is.pohodlne.info/udalost/detail/7276514b04c88c5d5b6d4f6eed82ab20",
          },
          primestsky: {
            title: "PŘÍMĚSTSKÝ TÁBOR",
            paragraphs: [
              "Příměstské tábory pořádáme v Markvartovicích nedaleko Ostravy, kde již kousíček za městem jsme v úplně jiném světě plném přírody.",
              "Děti přicházejí ráno a odpoledne odcházejí domů. Program plný tance, her v přírodě a kamarádů.",
            ],
            location: "Markvartovice u Ostravy",
            terms: "Červenec & Srpen",
            food: "Oběd, svačina, pitný režim, program",
            julyUrl: "https://is.pohodlne.info/udalost/detail/963ee4c7ec8f45e975dc32e22460b0e5",
            augustUrl: "https://is.pohodlne.info/udalost/detail/a7f620f6e30b373bdbc66a86b8c9b407",
            poster: "/assets/imgs/downloaded/plakat_carmen_primestsky_1.webp",
          },
        },
      });
    }

    // 2. Naseedujeme registrations, pokud je tabulka prázdná
    const existingReg = await ctx.db.query("registrations").first();
    if (!existingReg) {
      const defaultRegs = [
        {
          category: "Taneční kurzy pro školy",
          title: "Taneční kurzy v mateřských školách",
          subtitle: "Výuka pro děti přímo ve vaší mateřské škole. Základy rytmiky a tance.",
          url: "https://is.pohodlne.info/udalost/detail/d4c837eedf5e2048fe21d93d5ca274a1",
          isActive: true,
          order: 1,
        },
        {
          category: "Taneční kurzy pro školy",
          title: "Taneční kurzy na základních školách",
          subtitle: "Výuka pro děti přímo ve vaší ZŠ. Moderní choreografie a taneční průprava.",
          url: "https://is.pohodlne.info/udalost/detail/6118bf5fd762fae6541e3077de5ab1aa",
          isActive: true,
          order: 2,
        },
        {
          category: "Taneční kurzy pro školy",
          title: "Taneční kurzy pro 9. třídy",
          subtitle: "Příprava na středoškolské plesy a výuka společenských tanců v KD Hlučín.",
          url: "https://is.pohodlne.info/udalost/detail/115696a4204f6c5f7dcba58921883d90",
          isActive: true,
          order: 3,
        },
        {
          category: "Taneční kurzy pro mládež a dospělé",
          title: "Taneční kurzy pro středoškoláky",
          subtitle: "Základní společenské tance, etiketa a slavnostní věneček.",
          url: "https://is.pohodlne.info/udalost/detail/c92f0f7b205016e42b7255009656c739",
          isActive: true,
          order: 4,
        },
        {
          category: "Taneční kurzy pro mládež a dospělé",
          title: "Taneční kurzy pro dospělé (manželské a přátelské páry)",
          subtitle: "Společenský večer, příjemná atmosféra, začátečníci i pokročilí.",
          url: "https://is.pohodlne.info/udalost/detail/66bdaa163d3d0f6da823bc9c7d3f4d03",
          isActive: true,
          order: 5,
        },
        {
          category: "Sportovní taneční klub & Tábory CARMEN",
          title: "Výuka sportovního tance – LR Cosmetic dance team",
          subtitle: "Zastřešeno Českým svazem tanečního sportu (ČSTS). Hobby i soutěžní úroveň.",
          url: "https://is.pohodlne.info/udalost/detail/5aa2b8b6509c8829651e7d51f4528b66",
          isActive: true,
          order: 6,
        },
        {
          category: "Sportovní taneční klub & Tábory CARMEN",
          title: "Letní spací tábor CARMEN (RK Budoucnost)",
          subtitle: "Celotáborová hra, taneční tréninky, in-line dráha a koupání v Beskydech.",
          url: "https://is.pohodlne.info/udalost/detail/7276514b04c88c5d5b6d4f6eed82ab20",
          isActive: true,
          order: 7,
        },
      ];

      for (const reg of defaultRegs) {
        await ctx.db.insert("registrations", reg);
      }
    }

    return { status: "seeded" };
  },
});
