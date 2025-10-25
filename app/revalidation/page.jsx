import { revalidateTag } from 'next/cache';
import { Card } from '../../components/card';
import { Markdown } from '../../components/markdown';
import { SubmitButton } from '../../components/submit-button';

export const metadata = {
    title: 'On-Demand Revalidation'
};

const tagName = 'randomWiki';
const randomWikiUrl = 'https://en.wikipedia.org/api/rest_v1/page/random/summary';
const maxExtractLength = 200;
const revalidateTTL = 60;

const explainer = `
This page perfoms a \`fetch\` on the server to get a random article from Wikipedia. 
The fetched data is then cached with a tag named "${tagName}" and a maximum age of ${revalidateTTL} seconds.

~~~jsx
const url = 'https://en.wikipedia.org/api/rest_v1/page/random/summary';

async function RandomArticleComponent() {
    const randomArticle = await fetch(url, {
        next: { revalidate: ${revalidateTTL}, tags: ['${tagName}'] }
    });
    // ...render
}
~~~

After the set time has passed, the first request for this page would trigger its rebuild in the background. When the new page is ready, subsequent requests would return the new page - 
see [\`stale-white-revalidate\`](https://www.netlify.com/blog/swr-and-fine-grained-cache-control/).

Alternatively, if the cache tag is explicitly invalidated by \`revalidateTag('${tagName}', 'max')\`, any page using that tag would be rebuilt in the background when requested. The \`'max'\` cacheLife profile (new in Next.js 16) enables background revalidation for long-lived content.

In real-life applications, tags are typically invalidated when data has changed in an external system (e.g., the CMS notifies the site about content changes via a webhook), or after a data mutation made through the site.

For this functionality to work, Next.js uses the [fine-grained caching headers](https://docs.netlify.com/platform/caching/) available on Netlify - but you can use these features on basically any Netlify site!
`;

export default async function Page() {
    async function revalidateWiki() {
        'use server';
        revalidateTag(tagName, 'max');
    }

    return (
        <>
            <h1 className="mb-8">Revalidation Basics</h1>
            <Markdown content={explainer} className="mb-6" />
            <form className="mb-8" action={revalidateWiki}>
                <SubmitButton text="Click to Revalidate" />
            </form>
            <RandomWikiArticle />
        </>
    );
}

async function RandomWikiArticle() {
    let content = null;
    let error = null;

    try {
        const randomWiki = await fetch(randomWikiUrl, {
            next: { revalidate: revalidateTTL, tags: [tagName] }
        });

        if (!randomWiki.ok) {
            throw new Error(`Wikipedia API returned ${randomWiki.status}: ${randomWiki.statusText}`);
        }

        content = await randomWiki.json();
    } catch (err) {
        error = err.message;
        console.error('Error fetching Wikipedia article:', err);
    }

    if (error || !content) {
        return (
            <Card className="max-w-2xl">
                <h3 className="text-2xl text-red-600">Error Loading Article</h3>
                <p className="text-red-500">
                    {error || 'Failed to load random Wikipedia article. Please try again later.'}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                    This might be due to API rate limits or temporary service issues.
                </p>
            </Card>
        );
    }

    let extract = content.extract;
    if (extract && extract.length > maxExtractLength) {
        const truncated = extract.slice(0, maxExtractLength);
        const lastSpaceIndex = truncated.lastIndexOf(' ');
        extract = (lastSpaceIndex > 0 ? truncated.slice(0, lastSpaceIndex) : truncated) + ' [...]';
    }

    return (
        <Card className="max-w-2xl">
            <h3 className="text-2xl text-neutral-900">{content.title || 'Unknown Title'}</h3>
            <div className="text-lg font-bold">{content.description || 'No description available'}</div>
            <p className="italic">{extract || 'No extract available'}</p>
            {content.content_urls?.desktop?.page && (
                <a target="_blank" rel="noopener noreferrer" href={content.content_urls.desktop.page}>
                    From Wikipedia
                </a>
            )}
        </Card>
    );
}
