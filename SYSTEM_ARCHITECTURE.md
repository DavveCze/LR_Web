# Architektonická specifikace systému (SYSTEM_ARCHITECTURE.md)

**Projekt:** LR-Dance (Taneční klub LR DANCE TEAM Ostrava & Taneční škola CARMEN)  
**Verze:** 2.0.0 (Revize dle architektonického interview `/grill-me`)  
**Status:** Schváleno a závazné pro implementaci  
**Garant architektury:** Senior Software Architect (`system-architect`)

---

## 1. Úvod a kontext systému

Webová aplikace **LR-Dance** slouží jako oficiální digitální prezentace tanečního klubu LR DANCE TEAM Ostrava a partnerské taneční školy CARMEN. 

### 1.1 Klíčové poslání a vymezení rozsahu
- **Reprezentace klubu:** Prezentace tanečních párů, výsledků ze soutěží ČSTS, profilů trenérů, fotogalerie a historie.
- **Informační servis:** Publikace klubových aktualit, tréninkových harmonogramů a rozvrhů tanečních sálů.
- **Externí zápis a přihlášky:** Samotné formální přihlašování a evidence plateb na kurzy a tábory probíhá v dedikovaném externím informačním systému **`is.pohodlne.info`**. Web LR-Dance na něj odkazuje prostřednictvím přímých CTA tlačítek a deeplinků.
- **Komunikační hub & Integrovaný Inbox v CMS:** Návštěvníci mají k dispozici kontaktní a poptávkový formulář pro dotazy. V CMS je tento modul koncipován jako **integrovaná e-mailová schránka / inbox zpráv**, kde mají Majitel i Admin oddělené sledování stavů přečtení a možnost zprávy připínat (`pin`).

---

## 2. Klíčoví aktéři a dvoustupňový autorizační model (Two-Tier RBAC)

Autentizace nevyužívá těžkou databázovou tabulku uživatelů, ale **odlehčenou a bezpečnou správu v konfiguraci/environmentu**, kde jsou přihlašovací údaje (uživatelské jméno i heslo) kryptograficky chráněny pomocí komponenty **`CryptoCore.php`** (AES-256-GCM / Argon2id / bcrypt hašování).

```mermaid
flowchart TD
    subgraph AuthLayer ["Bezpečnostní vrstva přihlášení (.env + CryptoCore.php)"]
        ENV["🔐 .env konfigurace<br/>(ADMIN_CREDENTIALS, OWNER_CREDENTIALS)"]
        CRYPTO["🛡️ CryptoCore.php<br/>(Ověření hashe hesel, šifrování tokenů)"]
        SESS["🍪 PHP Session (HttpOnly, SameSite=Lax)<br/>$_SESSION['user_role'] = 'admin' | 'owner'"]
    end

    subgraph Roles ["Oprávnění v systému"]
        direction TB
        R_ADMIN["⚙️ Role: ADMIN<br/>(Technický správce & Vedení)"]
        R_OWNER["👔 Role: OWNER<br/>(Majitel taneční školy)"]
        R_PUBLIC["👤 Role: UŽIVATEL<br/>(Veřejný návštěvník)"]
    end

    ENV --> CRYPTO --> SESS
    SESS -->|"Plná oprávnění"| R_ADMIN
    SESS -->|"Omezená oprávnění"| R_OWNER
```

### 2.1 Matice oprávnění

| Modul / Funkce | Uživatel (Veřejnost) | Majitel (`owner`) | Administrátor (`admin`) |
| :--- | :---: | :---: | :---: |
| **Veřejný web & Procházení sekcí** | ✅ Povoleno | ✅ Povoleno | ✅ Povoleno |
| **Přesměrování na `is.pohodlne.info`** | ✅ Povoleno | ✅ Povoleno | ✅ Povoleno |
| **Odeslání zprávy / dotazu z webu** | ✅ Povoleno | ✅ Povoleno | ✅ Povoleno |
| **CMS Inbox: Čtení zpráv a dotazů** | ❌ Zakázáno | ✅ Povoleno | ✅ Povoleno |
| **CMS Inbox: Vlastní stav viděno / přečteno** | ❌ Zakázáno | ✅ Nezávislý stav | ✅ Nezávislý stav |
| **CMS Inbox: Připnutí zprávy (PIN)** | ❌ Zakázáno | ✅ Vlastní PIN | ✅ Vlastní PIN |
| **CMS: Správa aktualit a článků** | ❌ Zakázáno | ❌ Zakázáno | ✅ Povoleno |
| **CMS: Správa trenérů a rozvrhů sálů** | ❌ Zakázáno | ❌ Zakázáno | ✅ Povoleno |
| **CMS: Nahrávání fotografií a galerie** | ❌ Zakázáno | ❌ Zakázáno | ✅ Povoleno |
| **Konfigurace systému a správa `.env`** | ❌ Zakázáno | ❌ Zakázáno | ✅ Povoleno |

---

## 3. Integrace třetích stran a interních modulů

1. **Externí systém přihlášek (`is.pohodlne.info`):**
   - Oficiální klientská databáze kurzů, členů a plateb. Web LR-Dance integruje dynamické směrování (CTA tlačítka s parametry konkrétních kurzů).

2. **Integrovaný CMS & Editor obsahu (Dashboard):**
   - Plně naroubovaný na stávající designový systém `LR_Web_FE` (Tailwind CSS, jednotná typografie, panelové karty).
   - Čerpá mechanismy z `dev-library` (kompaktní formuláře, drag & drop, tabulkové náhledy, instantní inline editace bez zbytečných závislostí).
   - Implementuje dvoustupňový strážce na frontendu (`RoleGuard` / `ProtectedRoute`) i backendu (`requireRole('admin' | 'owner')`).

3. **Transakční Mailer (`UniversalMailer.php`) – Fail-Safe Hybridní model:**
   - **Databáze je primární pravda:** Zpráva z kontaktního formuláře se v prvním kroku uloží do PostgreSQL. Pokud selže SMTP server nebo síť, data se neztratí a zobrazí se v CMS Inboxu.
   - **Obousměrné notifikace:**
     - Klient obdrží okamžité automatické potvrzení o doručení zprávy.
     - Vedení klubu (Admin i Owner) obdrží okamžitý e-mailový alert s obsahem zprávy.
   - **Volitelný týdenní digest:** Podpora pro souhrnný týdenní e-mail přes odlehčený cron skript.

---

## 4. C4 Kontextový diagram (C4 Context Diagram)

```mermaid
flowchart TB
    subgraph Actors ["Aktéři systému"]
        U["👤 Veřejný návštěvník<br/>(Rodič / Tanečník)"]
        O["👔 Majitel klubu<br/>(Správce zpráv v CMS Inboxu)"]
        A["⚙️ Administrátor<br/>(Správce systému & CMS Editoru)"]
    end

    subgraph SystemLR ["Systémová hranice: LR-Dance"]
        LR["🌐 Webová aplikace LR-Dance<br/>[React 19 SPA + PHP REST API + PostgreSQL]<br/>Zajišťuje prezentaci, CMS Inbox zpráv a editor obsahu."]
    end

    subgraph External ["Externí služby & Systémy"]
        IS_POHODLNE["📋 is.pohodlne.info<br/>(Externí rezervační a platební systém pro přihlášky na kroužky a tábory)"]
        SMTP_SRV["✉️ SMTP Server<br/>(Záložní a transakční rozesílka notifikací)"]
        GEO_SRV["🌍 GeoIP / Cloudflare<br/>(Detekce návštěvníků a antispam ochrana pro ČR)"]
    end

    U -->|"Prohlíží web a odesílá dotazy"| LR
    U -->|"Přihlašuje se na kurzy a tábory"| IS_POHODLNE
    O -->|"Spravuje zprávy, čte a připíná dotazy v CMS Inboxu"| LR
    A -->|"Spravuje kompletní web, obsah, rozvrhy a fotky v CMS"| LR

    LR -->|"Odesílá okamžité e-maily klientům a vedení"| SMTP_SRV
    LR -->|"Ověřuje integritu a lokalitu odesílatele"| GEO_SRV
```

---

## 5. C4 Kontejnerový diagram (C4 Container Diagram)

```mermaid
flowchart TB
    subgraph ClientContainer ["Klientská vrstva (Browser)"]
        SPA["💻 React SPA (Frontend)<br/>[React 19, TypeScript, Vite, Tailwind CSS]<br/>- Veřejný prezentační web<br/>- Dvoustupňový CMS Dashboard (Admin / Owner)<br/>- Integrovaný Inbox modul zpráv"]
    end

    subgraph AppContainer ["Serverová a aplikační vrstva (Docker / Hostitel)"]
        APACHE["🛡️ Web Server / Reverse Proxy<br/>[Apache + mod_rewrite]<br/>HTTPS, CORS, směrování /api na PHP runtime."]
        
        subgraph BackendCore ["PHP 8.x Backend Core"]
            AUTH_GATE["🔑 Auth & CryptoCore<br/>(Session RBAC, dvoustupňová autentizace)"]
            SEC_GUARD["🛡️ SecurityGuardian<br/>(Antispam, Honeypot, Rate Limiter)"]
            API_ROUTER["📡 REST JSON API Endpointy<br/>(contact.php, news.php, trainers.php, ...)"]
            MAILER["✉️ UniversalMailer<br/>(Socket SMTP / TLS notifikace)"]
        end
    end

    subgraph DataContainer ["Datová a perzistentní vrstva"]
        PG[("🗄️ PostgreSQL Databáze<br/>[PostgreSQL 15+]<br/>Ukládá zprávy, stavy přečtení (Admin/Owner),<br/>připnuté zprávy, aktuality, tanečníky a rozvrhy.")]
        MEDIA["📁 Souborový systém (Uploads)<br/>Optimalizované WebP fotografie s AutoCompress."]
    end

    subgraph ExternalServices ["Externí systémy"]
        EXT_POHODLNE["📋 is.pohodlne.info (Přihlášky)"]
        SMTP["✉️ Poštovní SMTP Server"]
    end

    SPA -->|"Odkazy s parametry na kurzy"| EXT_POHODLNE
    SPA -->|"HTTPS REST JSON (HttpOnly Cookies)"| APACHE
    APACHE --> AUTH_GATE
    AUTH_GATE --> SEC_GUARD --> API_ROUTER
    API_ROUTER -->|"PDO Prepared Statements"| PG
    API_ROUTER -->|"Ukládání médií"| MEDIA
    API_ROUTER -->|"Asynchronní / fail-safe dispatch"| MAILER
    MAILER -->|"Socket TLS"| SMTP
```

---

## 6. Datový tok mezi React frontendem a backendem

Komunikace je centralizována v `LR_Web_FE/src/api/client.ts` přes funkci `apiFetch<T>()` s automatickým posíláním cookie přihlášení (`credentials: 'include'`).

### 6.1 Životní cyklus zprávy: Od odeslání po CMS Inbox (Sekvenční diagram)

```mermaid
sequenceDiagram
    autonumber
    actor User as Veřejný návštěvník
    participant FE as React Frontend (Web)
    participant SEC as SecurityGuardian (PHP)
    participant API as contact.php (API)
    participant DB as PostgreSQL
    participant Mail as UniversalMailer
    actor Owner as Majitel (CMS Inbox)
    actor Admin as Admin (CMS Inbox)

    User->>FE: Vyplní kontaktní dotaz / zprávu
    FE->>API: POST /api/contact.php (payload + honeypot + _ts)
    API->>SEC: Kontrola Honeypot, TimeWindow (>=2s), RateLimit & CZ Geofence
    alt Detekován robot nebo spam
        SEC-->>API: Blokace / Silent drop (200 OK)
    else Regulérní návštěvník
        API->>DB: INSERT INTO contact_inquiries (name, email, phone, message)
        DB-->>API: Vrátí nové inquiry_id
        
        par Fail-safe e-mailové notifikace
            API->>Mail: Potvrzovací e-mail klientovi
            API->>Mail: Okamžitý alert vedení (Owner + Admin)
        end
        
        API-->>FE: 200 OK { status: "success", message: "Zpráva odeslána" }
        FE->>User: Zobrazení potvrzení o odeslání
    end

    note over Owner,Admin: Zpráva se okamžitě zobrazí v CMS Inboxu oběma rolím jako 'NOVÁ' (zvýrazněná)

    Owner->>FE: Otevře detail zprávy v CMS
    FE->>API: POST /api/inquiries/mark-read.php { id, role: 'owner' }
    API->>DB: UPDATE inquiry_recipient_states SET is_read = true WHERE role = 'owner'
    DB-->>API: OK
    FE-->>Owner: Zpráva zšedne (přečteno), ale u Admina zůstává stále nová!

    Owner->>FE: Klikne na špendlík (Připnout zprávu)
    FE->>API: POST /api/inquiries/toggle-pin.php { id, role: 'owner' }
    API->>DB: UPDATE inquiry_recipient_states SET is_pinned = NOT is_pinned WHERE role = 'owner'
    FE-->>Owner: Zpráva je připnuta nahoru v seznamu majitele
```

---

## 7. Bezpečnostní model a Misuse Cases (Risk Matrix)

```mermaid
flowchart LR
    Threat["Potenciální incident / Vektor útoku"] --> Handler{"Obranný mechanismus"}
    Handler -->|"Výpadek sítě / offline klient"| M1["Zachování stavu ve formuláři, retry mechanismus v client.ts"]
    Handler -->|"Expirovaná / neplatná session"| M2["HTTP 401, čisté odhlášení a redirect na /login"]
    Handler -->|"Spam bot & zaplavení formuláře"| M3["SecurityGuardian: Honeypot, časové okno, flock rate limit (429)"]
    Handler -->|"Zahraniční spamové farmy"| M4["Geofencing ČR (kontrola předvolby + GeoIP -> 403)"]
    Handler -->|"Pokus o zneužití práv majitelem"| M5["Dvoustupňový Role Guard: blokace přístupu k admin endpointům"]
    Handler -->|"Únik hesla z konfigurace"| M6["CryptoCore: šifrování a bezpečný hash v .env"]
```

### 7.1 Detailní mitigace Misuse Cases

1. **Selhání sítě (Network Failure / Offline stav):**
   - **Chování:** Pokud při odesílání dotazu selže spojení (např. mobilní internet návštěvníka), `apiFetch` zachytí síťovou výjimku.
   - **Řešení:** React komponenta formuláře **nesmaže vyplněná data**, zobrazí uživateli zřetelnou notifikaci s tlačítkem „Zkusit odeslat znovu“.

2. **Expirovaný nebo neplatný token / session:**
   - **Chování:** Majitel nebo administrátor opustí prohlížeč a pokusí se o akci po vypršení platnosti session (`cookie_lifetime = 3600s`).
   - **Řešení:** Backendový kontrolor `requireAuth()` okamžitě vrací `401 Unauthorized`. Frontendový `client.ts` zachytí 401 a `ProtectedRoute` automaticky provede bezpečné přesměrování na `/login` bez poškození stavu aplikace.

3. **Pokus o spam a formulářový flooding:**
   - **Chování:** Skript se pokouší hromadně zahltit inbox stovkami zpráv.
   - **Řešení:**
     1. *Honeypot:* Pole `website` / `_hp` neviditelná pro lidi – pokud jsou vyplněna, backend vrátí tichý úspěch (silent drop).
     2. *Časové razítko:* Odeslání formuláře pod 2 sekundy od vygenerování stránky je odmítnuto kódem `422`.
     3. *Rate Limiting:* Souborově zamykaný rate limiter (`SecurityGuardian::checkRateLimit`) s limitem max. 5 požadavků za 10 minut na IP adresu.

4. **Přístup k nepovoleným funkcím majitelem (Privilege Escalation):**
   - **Chování:** Majitel se pokusí přímo zavolat API pro úpravu trenérů, fotek nebo systémových souborů.
   - **Řešení:** Každý citlivý endpoint má strážce `requireRole('admin')`. Pokud je v session nastavena hodnota `owner`, backend vrátí `403 Forbidden` a zapíše bezpečnostní log.

---

## 8. Databázová architektura a relace (PostgreSQL)

Pro podporu oddělených stavů čtení a připínání zpráv pro Majitele i Administrátora je navržena čistá relační struktura:

```mermaid
erDiagram
    contact_inquiries ||--o{ inquiry_recipient_states : "má stavy pro příjemce"
    dancers ||--o{ dance_pairs : "partner 1 (idt1)"
    dancers ||--o{ dance_pairs : "partner 2 (idt2)"
    dance_pairs ||--o{ competition_results : "výsledky párů"

    contact_inquiries {
        serial id PK
        varchar name
        varchar email
        varchar phone
        text message
        varchar ip_address
        timestamptz created_at
    }

    inquiry_recipient_states {
        serial id PK
        integer inquiry_id FK
        varchar recipient_role "admin | owner"
        boolean is_read "výchozí: false"
        boolean is_pinned "výchozí: false"
        timestamptz read_at
        timestamptz updated_at
    }

    news {
        serial id PK
        varchar headline
        text text
        date date
    }

    trainers {
        serial id PK
        varchar name
        varchar role_title
        text bio
        varchar photo_url
        integer sort_order
        boolean is_active
    }

    training_schedules {
        serial id PK
        varchar day_of_week
        time time_from
        time time_to
        varchar group_name
        varchar hall
        varchar trainer_name
    }

    dancers {
        serial idt PK
        varchar name
        varchar surname
        varchar category_lat
        varchar category_stt
        integer partner_idt FK
        timestamptz created_at
    }

    dance_pairs {
        serial pair_id PK
        integer idt1 FK
        integer idt2 FK
        integer points
        boolean finals
    }

    competition_results {
        serial id PK
        integer pair_id FK
        varchar competition_name
        date date
        varchar location
        varchar placement
    }
```

### 8.1 Popis klíčových tabulek Inboxu a Web CMS

#### 1. `contact_inquiries` (Přijaté dotazy a zprávy)
- `id` (SERIAL, PK): Identifikátor zprávy.
- `name` (VARCHAR(150)): Jméno a příjmení odesílatele.
- `email` (VARCHAR(255)): Kontaktní e-mail.
- `phone` (VARCHAR(50)): Telefonní číslo pro případný kontakt.
- `message` (TEXT): Znění zprávy z formuláře.
- `ip_address` (VARCHAR(45)): IP adresa pro audit a geofencing.
- `created_at` (TIMESTAMPTZ, default `NOW()`): Čas doručení.
- *Indexy:* `idx_contact_inquiries_created_at` (B-Tree sestupně).

#### 2. `inquiry_recipient_states` (Stav zprávy pro Admina a Majitele)
Umožňuje nezávislé stavy „viděno“ a „připnuto“ pro obě role bez ovlivnění druhého uživatele.
- `id` (SERIAL, PK): Identifikátor stavu.
- `inquiry_id` (INTEGER, FK -> `contact_inquiries.id` ON DELETE CASCADE).
- `recipient_role` (VARCHAR(20)): Identifikátor role (`'admin'` nebo `'owner'`).
- `is_read` (BOOLEAN, default `false`): Zda uživatel dané role zprávu otevřel (po otevření zešedne).
- `is_pinned` (BOOLEAN, default `false`): Příznak připnutí zprávy na vrchol seznamu.
- `read_at` (TIMESTAMPTZ, nullable): Čas prvního přečtení.
- `updated_at` (TIMESTAMPTZ, default `NOW()`): Čas poslední změny stavu.
- *Unikátní index:* `UNIQUE(inquiry_id, recipient_role)`.

#### 3. `trainers`, `training_schedules`, `news`
- Tabulky spravované výhradně rolí `admin` v CMS pro zajištění aktuálních informací o trenérském týmu, týdenních trénincích sálů a klubových novinkách.

---

## 9. Technologický stack a provozní parametry

| Komponenta | Technologie | Verze / Poznámka |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript 5.8+ | Bundlováno přes Vite 8, SPA routing přes React Router 7 |
| **Design systém** | Tailwind CSS + Lucide Icons | Karty, modální okna, indikátory novinek (badge, špendlík) |
| **Backend Runtime** | PHP 8.2+ | Nativní moduly PDO PostgreSQL, OpenSSL, GD/WebP |
| **Databáze** | PostgreSQL 15+ | Běží v Docker kontejneru s perzistentním volume `pgdata` |
| **Šifrování & Bezpečnost** | `CryptoCore.php` + `SecurityGuardian.php` | AES-256-GCM, atomický flock rate limit, antispam CZ |
| **E-mail Subsystem** | `UniversalMailer.php` | Přímé Socket SMTP spojení s TLS autentizací |
| **Externí Integrace** | `is.pohodlne.info` | Rezervační a členský systém (přesměrování z CTA tlačítek) |

---

## 10. Kontrolní checklist a akceptační kritéria

- [x] Ověřeno, že přihlašování na kurzy je delegováno na `is.pohodlne.info`.
- [x] Implementován model **CMS Inbox** s oddělenými thready stavů pro Admina a Majitele (čtení/připínání).
- [x] Přihlašovací údaje spravovány v `.env` s kryptografickým ověřením přes `CryptoCore.php`.
- [x] Fail-safe hybridní model pro Mailer – primární perzistence v PostgreSQL, transakční e-mail jako notifikace.
- [x] Všechny Mermaid diagramy validovány a otestovány pro zobrazení v GitHub/Markdown prohlížeči.
