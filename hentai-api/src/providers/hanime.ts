import { load } from "cheerio";

export default async function fetchHanime(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://hanime.tv/search?q=${encodeURIComponent(query)}`;
    const res = await fetch(searchUrl);
    const html = await res.text();

    const $ = load(html);
    const firstLink = $('a[href*="/videos/hentai/"]').attr("href");

    if (!firstLink) return null;
    return `https://hanime.tv${firstLink}`;
  } catch (err) {
    console.error("fetchHanime error:", err);
    return null;
  }
}
