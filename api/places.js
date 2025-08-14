export const config = { runtime: 'edge' };

const ALLOWED_ORIGINS = [
  'https://www.garryebrey.com',
  'http://localhost:3000',
  'http://localhost:5173'
];

export default async function handler(req) {
  const { searchParams } = new URL(req.url);
  const placeId = searchParams.get('placeId');
  const languageCode = searchParams.get('languageCode') || 'en-GB';

  const origin = req.headers.get('origin');
  const cors = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : 'https://www.garryebrey.com',
    'Vary': 'Origin',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (!placeId) {
    return new Response(JSON.stringify({ error: { message: 'Missing placeId' }}), {
      status: 400, headers: { 'content-type': 'application/json', ...cors }
    });
  }

  const apiKey = process.env.PLACES_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: { message: 'Server missing PLACES_API_KEY' }}), {
      status: 500, headers: { 'content-type': 'application/json', ...cors }
    });
  }

  const fields = [
    'id','displayName','googleMapsUri','rating','userRatingCount',
    'reviews.rating','reviews.text','reviews.originalText','reviews.publishTime','reviews.relativePublishTimeDescription',
    'reviews.authorAttribution.displayName','reviews.authorAttribution.photoUri','reviews.authorAttribution.uri','reviews.googleMapsUri'
  ].join(',');

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=${languageCode}&fields=${fields}`;

  const upstream = await fetch(url, { headers: { 'X-Goog-Api-Key': apiKey } });
  const body = await upstream.text();

  const headers = {
    'content-type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    'CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    'Vercel-CDN-Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600',
    ...cors
  };

  return new Response(body, { status: upstream.status, headers });
}
