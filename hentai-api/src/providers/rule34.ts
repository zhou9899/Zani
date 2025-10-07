export class Rule34 {
  async fetchSearchResult(tag: string) {
    return { results: [{ image: `https://rule34.example/${tag}.jpg` }] };
  }
}

const r34 = new Rule34();

export async function fetchRule34(tag: string): Promise<string | null> {
  try {
    const results = await r34.fetchSearchResult(tag);
    return results.results?.[0]?.image ?? null;
  } catch (err) {
    console.error("fetchRule34 error:", err);
    return null;
  }
}
