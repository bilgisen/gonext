const { getStore } = require('@netlify/blobs');
const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { key } = event.queryStringParameters;
  
  if (!key) {
    return {
      statusCode: 400,
      body: 'Missing key parameter',
      headers: { 'Content-Type': 'application/json' }
    };
  }

  try {
    // Try to get from Netlify Blobs first
    const store = getStore({
      name: 'news-images',
      consistency: 'strong',
      siteID: '3a3e9ce3-d5df-4556-b315-3765909dc963'
    });

    const blob = await store.get(key, { type: 'blob' });
    
    if (blob) {
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': blob.type || 'image/jpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*'
        },
        body: buffer.toString('base64'),
        isBase64Encoded: true
      };
    }
    
    // If not found in Blobs, try to fetch from the original URL
    const response = await fetch(`https://news-images--3a3e9ce3-d5df-4556-b315-3765909dc963.blob.netlify.app/${key}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const imageBuffer = await response.buffer();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': response.headers.get('content-type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*'
      },
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('Error serving blob image:', error);
    return {
      statusCode: 500,
      body: 'Error serving image'
    };
  }
};
