import { getStore } from "@netlify/blobs";

export async function handler(event, context) {
  const key = event.queryStringParameters?.key;

  if (!key) {
    return {
      statusCode: 400,
      body: "Missing key parameter"
    };
  }

  try {
    const store = getStore({
      name: "news-images",
      consistency: "strong"
    });

    const blob = await store.get(key, {
      type: "stream"
    });

    if (!blob) {
      return {
        statusCode: 404,
        body: "Image not found"
      };
    }

    // Get metadata for content type
    const metadata = await store.getMetadata(key);

    return {
      statusCode: 200,
      body: blob,
      headers: {
        'Content-Type': metadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000'
      }
    };
  } catch (error) {
    console.error('Error retrieving blob:', error);
    return {
      statusCode: 500,
      body: "Internal server error"
    };
  }
}
