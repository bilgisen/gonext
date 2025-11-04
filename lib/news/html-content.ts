import { marked } from 'marked';

/**
 * Converts markdown content to HTML and updates the content_html field
 * @param newsItem News item with markdown content
 * @returns News item with updated content_html field
 */
export function processMarkdownContent<T extends { content_md?: string | null; content_html?: string | null }>(
  newsItem: T
): T & { content_html: string } {
  // If content_md is empty, use an empty string for content_html
  if (!newsItem.content_md) {
    return {
      ...newsItem,
      content_html: newsItem.content_html || ''
    };
  }

  try {
    // Convert markdown to HTML
    const html = marked.parse(newsItem.content_md, {
      gfm: true,    // GitHub Flavored Markdown
      breaks: true  // Convert \n to <br>
      // Note: For production, consider using DOMPurify or similar
      // to sanitize the HTML output for security
    });

    return {
      ...newsItem,
      content_html: html
    };
  } catch (error) {
    console.error('Error converting markdown to HTML:', error);
    // Return the original item with content_html set to content_md as fallback
    return {
      ...newsItem,
      content_html: newsItem.content_html || newsItem.content_md
    };
  }
}

/**
 * Processes markdown content in a news item before database insertion
 * @param newsItem News item to process
 * @returns Processed news item with HTML content
 */
export function prepareNewsItemForInsert<T extends { content_md?: string | null; content_html?: string | null }>(
  newsItem: T
): T & { content_html: string } {
  return processMarkdownContent(newsItem);
}
