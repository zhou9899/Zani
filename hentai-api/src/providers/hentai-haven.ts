export class HentaiHaven {
  async fetchSearchResult(tag: string) {
    return [{ id: "123", cover: "https://hentaihaven.example/cover.jpg" }];
  }
  async fetchInfo(id: string) {
    return { episodes: [{ id: "ep1" }], sources: [{ src: "https://hentaihaven.example/video.mp4" }] };
  }
}

const hh = new HentaiHaven();

export async function fetchHentaiHaven(tag: string): Promise<string | null> {
  try {
    const results = await hh.fetchSearchResult(tag);
    if (!results || results.length === 0) return null;

    const info = await hh.fetchInfo(results[0].id);
    return info.sources?.[0]?.src ?? null;
  } catch (err) {
    console.error("fetchHentaiHaven error:", err);
    return null;
  }
}
