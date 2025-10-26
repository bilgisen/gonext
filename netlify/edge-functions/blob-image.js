// netlify/edge-functions/blob-image.js
import { getStore } from "@netlify/blogs";

export default async (request, context) => {
  // Get the URL and extract the key from query parameters
  const url = new URL(request.url);
  const key = url.searchParams.get("id");

  if (!key) {
    return new Response("Missing id parameter", { status: 400 });
  }

  try {
    // Get the blob store
    const store = getStore({
      name: "news-images",
      consistency: "strong",
    });

    // Get the blob data
    const blob = await store.get(key, { type: "stream" });

    if (!blob) {
      return new Response("Image not found", { status: 404 });
    }

    // Get metadata for content type
    const metadata = await store.getMetadata(key);

    // Return the image with appropriate headers
    return new Response(blob, {
      headers: {
        "Content-Type": metadata?.contentType || "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error retrieving blob:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

export const config = {
  path: "/api/blob-image",
};
