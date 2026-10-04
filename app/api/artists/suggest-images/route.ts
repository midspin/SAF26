import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const artistName = (body.artistName || body.artist || '').trim();
    const artworkTitle = (body.artworkTitle || body.artworkName || body.artwork || '').trim();

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const cx = process.env.GOOGLE_SEARCH_CX;

    // Helper to fetch images from Google Custom Search JSON API
    const fetchGoogleImages = async (query: string): Promise<string[]> => {
      if (!query || !apiKey || !cx) return [];
      try {
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(
          query
        )}&searchType=image&num=6`;

        const res = await fetch(url);
        if (!res.ok) {
          console.warn(`Google Search API warning (${res.status}):`, await res.text());
          return [];
        }

        const data = await res.json();
        if (!data.items || !Array.isArray(data.items)) return [];

        const validLinks: string[] = [];
        for (const item of data.items) {
          const link = item?.link;
          if (
            typeof link === 'string' &&
            (link.startsWith('http://') || link.startsWith('https://')) &&
            !link.includes('example.com')
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

    // Queries as per specification:
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

    // Run both queries in parallel with Promise.all
    let [profileCandidates, artworkCandidates] = await Promise.all([
      profileQuery ? fetchGoogleImages(profileQuery) : Promise.resolve([]),
      artworkQuery ? fetchGoogleImages(artworkQuery) : Promise.resolve([]),
    ]);

    // Fallback curated candidates if API key is not configured or query yielded no results
    // This guarantees the UI modal can be tested cleanly even in offline/dev mode.
    if (profileCandidates.length === 0 && artistName) {
      profileCandidates = [
        `https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=800&q=80`,
      ];
    }

    if (artworkCandidates.length === 0 && (artworkTitle || artistName)) {
      artworkCandidates = [
        `https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1578926375605-eaf7559b1458?auto=format&fit=crop&w=800&q=80`,
        `https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?auto=format&fit=crop&w=800&q=80`,
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
