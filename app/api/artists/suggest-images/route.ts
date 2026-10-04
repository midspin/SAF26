import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const artistName = (body.artistName || body.artist || '').trim();
    const artworkTitle = (body.artworkTitle || body.artworkName || body.artwork || '').trim();

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    // 1. Google Custom Search JSON API
    const fetchGoogleImages = async (query: string): Promise<string[]> => {
      if (!query || !apiKey || !cx) return [];
      try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(
          query
        )}&searchType=image&num=6`;

        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`Google Search API returned status ${res.status}`);
          return [];
        }

        const data = await res.json();
        if (!data.items || !Array.isArray(data.items)) return [];

        const validLinks: string[] = [];
        for (const item of data.items) {
          const link = item?.link;
          if (
            typeof link === 'string' &&
            (link.startsWith('http://') || link.startsWith('https://'))
          ) {
            validLinks.push(link);
          }
        }
        return validLinks.slice(0, 6);
      } catch (err) {
        console.error('Error fetching Google Search images:', err);
        return [];
      }
    };

    // 2. Wikipedia & Wikimedia Media API Search (Real-time dynamic fallback)
    const fetchWikipediaImages = async (query: string): Promise<string[]> => {
      if (!query || !query.trim()) return [];
      try {
        const url = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
          query
        )}&gsrlimit=12&prop=pageimages|images&pithumbsize=800&format=json`;

        const res = await fetch(url, {
          headers: { 'User-Agent': 'SAF-Orbita/1.0 (contact@saf.art)' },
        });
        if (!res.ok) return [];
        const data = await res.json();
        const pages = data?.query?.pages || {};

        const urls: string[] = [];
        for (const key of Object.keys(pages)) {
          const src = pages[key]?.thumbnail?.source;
          if (src && typeof src === 'string') {
            urls.push(src);
          }
        }
        return urls;
      } catch (err) {
        console.error('Error fetching Wikipedia images:', err);
        return [];
      }
    };

    // 3. Dynamic Keyword-Seeded Image Generator (Ensures unique candidate images per artist/artwork name)
    const generateDynamicCandidates = (name: string, category: 'portrait' | 'artwork', count: number): string[] => {
      const cleanSeed = encodeURIComponent(name.trim() || category);
      const candidates: string[] = [];
      for (let i = 1; i <= count; i++) {
        if (category === 'portrait') {
          candidates.push(`https://loremflickr.com/800/800/${cleanSeed},portrait/all?lock=${i}`);
        } else {
          candidates.push(`https://loremflickr.com/800/800/${cleanSeed},art,painting/all?lock=${10 + i}`);
        }
      }
      return candidates;
    };

    // Construct queries as per spec:
    // Artist Profile: "${artistName}" artist portrait OR photo
    // Artwork: "${artworkName}" "${artistName}" artwork
    const profileQuery = artistName ? `"${artistName}" artist portrait OR photo` : '';
    const artworkQuery =
      artworkTitle && artistName
        ? `"${artworkTitle}" "${artistName}" artwork`
        : artworkTitle
        ? `"${artworkTitle}" artwork`
        : artistName
        ? `"${artistName}" artwork`
        : '';

    // Step A: Attempt Google Custom Search API
    let [googleProfile, googleArtwork] = await Promise.all([
      profileQuery ? fetchGoogleImages(profileQuery) : Promise.resolve([]),
      artworkQuery ? fetchGoogleImages(artworkQuery) : Promise.resolve([]),
    ]);

    let profileCandidates = googleProfile;
    let artworkCandidates = googleArtwork;

    // Step B: Fall back to Wikipedia Search if Google returned fewer than 6 items
    if (profileCandidates.length < 6 && artistName) {
      const wikiProfile = await fetchWikipediaImages(`${artistName} artist portrait`);
      profileCandidates = Array.from(new Set([...profileCandidates, ...wikiProfile])).slice(0, 6);
    }

    if (artworkCandidates.length < 6 && (artworkTitle || artistName)) {
      const searchQuery = artworkTitle ? `${artworkTitle} ${artistName}` : artistName;
      const wikiArtwork = await fetchWikipediaImages(`${searchQuery} artwork`);
      artworkCandidates = Array.from(new Set([...artworkCandidates, ...wikiArtwork])).slice(0, 6);
    }

    // Step C: Pad remaining slots with dynamic name-seeded image search results
    if (profileCandidates.length < 6 && artistName) {
      const needed = 6 - profileCandidates.length;
      profileCandidates = [
        ...profileCandidates,
        ...generateDynamicCandidates(artistName, 'portrait', needed),
      ];
    }

    if (artworkCandidates.length < 6 && (artworkTitle || artistName)) {
      const needed = 6 - artworkCandidates.length;
      const seedName = artworkTitle || artistName;
      artworkCandidates = [
        ...artworkCandidates,
        ...generateDynamicCandidates(seedName, 'artwork', needed),
      ];
    }

    return NextResponse.json({
      profileCandidates,
      artworkCandidates,
    });
  } catch (error: any) {
    console.error('Error in /api/artists/suggest-images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to suggest images' },
      { status: 500 }
    );
  }
}
