/**
 * Centralizovaný klient pro komunikaci s backendem (Convex + Fallback REST API).
 * Podporuje jak moderní reaktivní Convex backend na Vercelu,
 * tak původní fallback cesty pro offline/vývojové účely.
 */
import { convex } from "../convex";
import { anyApi } from "convex/server";

// Dynamic API proxy
export const api = anyApi as Record<string, Record<string, any>>;

const rawBase = typeof import.meta.env.VITE_API_URL === "string" ? import.meta.env.VITE_API_URL.trim() : "";

export const API_BASE_URL = rawBase !== ""
  ? `${rawBase.replace(/\/$/, '')}/api`
  : '/api';

export function apiUrl(endpoint: string): string {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
}

/**
 * Bezpečné parsování JSON z HTTP odpovědi (zabraňuje pádu na HTML doctype)
 */
async function safeJson<T = any>(res: Response): Promise<T | null> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = apiUrl(endpoint);
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const isJson = (response.headers.get("content-type") || "").includes("application/json");

  if (!response.ok || !isJson) {
    let message = `API request failed with status ${response.status}`;
    if (isJson) {
      try {
        const errorJson = await response.json();
        if (errorJson.message) message = errorJson.message;
      } catch {
        // use default message
      }
    }
    throw new Error(message);
  }

  return response.json();
}

/**
 * Získání obsahu stránky (carmen, partneři, tréninková místa apod.)
 */
export async function getPageContent<T = any>(pageKey: string): Promise<T | null> {
  if (convex) {
    try {
      const data = await (convex as any).query(api.content.getContent, { pageKey });
      if (data) return data as T;
    } catch (err) {
      console.warn(`[Convex] Nepodařilo se načíst obsah pro ${pageKey}, zkouším fallback:`, err);
    }
  }

  try {
    const res = await fetch(apiUrl(`content.php?page=${encodeURIComponent(pageKey)}`));
    if (res.ok) {
      const json = await safeJson<T>(res);
      if (json) return json;
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Uložení obsahu stránky do CMS
 */
export async function savePageContent(pageKey: string, data: any): Promise<void> {
  if (convex) {
    await (convex as any).mutation(api.content.updateContent, { pageKey, data });
    return;
  }

  await fetch(apiUrl("content.php"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ page: pageKey, content: data }),
    credentials: "include",
  });
}

/**
 * Odeslání zprávy z kontaktního formuláře (Inquiry)
 */
export async function submitContactInquiry(payload: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  page?: string;
  website?: string; // honeypot
  _ts?: number;
}): Promise<{ status: string; message?: string }> {
  // Kontrola honeypotu na frontendu
  if (payload.website && payload.website.trim() !== "") {
    return { status: "success", message: "Zpráva odeslána." };
  }

  if (convex) {
    try {
      await (convex as any).mutation(api.inquiries.submitInquiry, {
        name: payload.name,
        email: payload.email,
        phone: payload.phone || undefined,
        message: payload.message,
        page: payload.page || "web",
      });
      return { status: "success", message: "Zpráva byla úspěšně odeslána." };
    } catch (err) {
      console.error("[Convex] Chyba odeslání zprávy:", err);
      throw new Error("Nepodařilo se odeslat zprávu přes server.");
    }
  }

  const response = await fetch(apiUrl("contact.php"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await safeJson(response);
  if (!response.ok || !result || result.status !== "success") {
    throw new Error((result && result.message) || "Odeslání zprávy selhalo.");
  }
  return result;
}

/**
 * Získání aktualit (Convex / fallback)
 */
export async function getNewsList<T = any>(options?: { latest?: boolean }): Promise<T[]> {
  if (convex) {
    try {
      const items = await (convex as any).query(api.news.listPublishedNews, {
        limit: options?.latest ? 1 : undefined,
      });
      if (items && Array.isArray(items)) {
        return items as T[];
      }
    } catch (err) {
      console.warn("[Convex] getNewsList failed, falling back:", err);
    }
  }

  try {
    const url = apiUrl(options?.latest ? "news.php?latest=1" : "news.php");
    const res = await fetch(url);
    if (res.ok) {
      const json = await safeJson(res);
      if (json && json.status === "success" && json.data) {
        return (Array.isArray(json.data) ? json.data : [json.data]) as T[];
      }
      if (Array.isArray(json)) return json as T[];
    }
  } catch {
    // ignore
  }

  return [];
}

/**
 * Získání trenérů (Convex / fallback)
 */
export async function getTrainersList<T = any>(): Promise<T[]> {
  if (convex) {
    try {
      const items = await (convex as any).query(api.trainers.listTrainers, {});
      if (items && Array.isArray(items)) return items as T[];
    } catch (err) {
      console.warn("[Convex] getTrainersList failed:", err);
    }
  }

  try {
    const res = await fetch(apiUrl("trainers.php"));
    if (res.ok) {
      const json = await safeJson(res);
      if (Array.isArray(json)) return json as T[];
      if (json && json.status === "success" && Array.isArray(json.data)) return json.data as T[];
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Získání tanečních párů a sólistů (Convex / fallback)
 */
export async function getDancersList<T = any>(type: "pair" | "single"): Promise<T[]> {
  if (convex) {
    try {
      const queryRef = type === "pair" ? api.dancers.listPairs : api.dancers.listSingles;
      const items = await (convex as any).query(queryRef, {});
      if (items && Array.isArray(items)) return items as T[];
    } catch (err) {
      console.warn(`[Convex] getDancersList (${type}) failed:`, err);
    }
  }

  try {
    const res = await fetch(apiUrl(`dancers.php?view=${type === "pair" ? "pairs" : "singles"}`));
    if (res.ok) {
      const json = await safeJson(res);
      if (Array.isArray(json)) return json as T[];
      if (json && json.status === "success" && Array.isArray(json.data)) return json.data as T[];
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Získání výsledků soutěží (Convex / fallback)
 */
export async function getResultsList<T = any>(limit?: number): Promise<T[]> {
  if (convex) {
    try {
      const items = await (convex as any).query(api.dancers.listResults, { limit });
      if (items && Array.isArray(items)) return items as T[];
    } catch (err) {
      console.warn("[Convex] getResultsList failed:", err);
    }
  }

  try {
    const res = await fetch(apiUrl("dancers.php?view=results"));
    if (res.ok) {
      const json = await safeJson(res);
      if (Array.isArray(json)) return json as T[];
      if (json && json.status === "success" && Array.isArray(json.data)) return json.data as T[];
    }
  } catch {
    // ignore
  }
  return [];
}

/**
 * Získání harmonogramu tréninků (Convex / fallback)
 */
export async function getScheduleList<T = any>(): Promise<T[]> {
  if (convex) {
    try {
      const items = await (convex as any).query(api.schedule.listSchedule, {});
      if (items && Array.isArray(items)) return items as T[];
    } catch (err) {
      console.warn("[Convex] getScheduleList failed:", err);
    }
  }

  try {
    const res = await fetch(apiUrl("training-schedule.php"));
    if (res.ok) {
      const json = await safeJson(res);
      if (Array.isArray(json)) return json as T[];
      if (json && json.status === "success" && Array.isArray(json.data)) return json.data as T[];
    }
  } catch {
    // ignore
  }
  return [];
}
