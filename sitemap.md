How to Automate Sitemap Generation in Next.js
#
javascript
#
beginners
#
webdev
#
programming
Hello, I'm Maneshwar. I'm working on FreeDevTools online currently building *one place for all dev tools, cheat codes, and TLDRs* — a free, open-source hub where developers can quickly find and use tools without any hassle of searching all over the internet.

Before diving into next-sitemap, it’s helpful to recall why sitemaps and robots.txt are valuable:

A sitemap.xml (or a set of sitemaps) helps search engines (Google, Bing, etc.) discover the URLs in your site, know when pages change (via <lastmod>), and understand how “important” pages are (via <priority> and <changefreq>).
A robots.txt file tells crawlers which paths they should or should not access. It can also point to the sitemap(s).
For modern frameworks like Next.js, which may have a mix of static pages, dynamic routes, server-side generated pages, etc., manually maintaining sitemap + robots.txt can be error-prone and tedious.
next-sitemap automates this process for Next.js apps, generating sitemaps and robots.txt based on your routes and configuration.

The GitHub README describes it as: “Sitemap generator for next.js. Generate sitemap(s) and robots.txt for all static/pre-rendered/dynamic/server-side pages.”

At a high level, next-sitemap is a utility that:

Parses your project (static, dynamic, SSR routes) and produces sitemap XML files (splitting if needed, indexing, etc.).
Optionally creates a robots.txt file that references the sitemap(s) and defines crawl rules (Allow, Disallow).
Provides hooks/customizations (transform, exclude, additional paths, custom policies).
Supports server-side dynamic sitemaps in Next.js (via API routes or Next 13 “app directory” routes).
Thus, instead of manually writing and updating your sitemap + robots.txt as your site evolves, you let next-sitemap keep them in sync automatically (or semi-automatically) based on config.

Some key benefits:

Less manual work / fewer mistakes: You don’t need to hand-craft XML or remember to update robots whenever routes change.
Consistency: The tool standardizes how your sitemap and robots are built.
Scalability: It can split large sitemap files, index them, and handle dynamic route generation.
Flexibility: You can override behavior (exclude some paths, set different priorities, add extra sitemap entries, control crawl policies).
Next.js integration: Works with both “pages” directory and new “app” directory / Next 13+, and supports server-side generation APIs for dynamic content.
In short: next-sitemap is the bridge between Next.js routes and proper SEO-friendly sitemap & robots files.

Installing and basic setup
Here is a step-by-step for getting started.

1. Install the package
yarn add next-sitemap
# or npm install next-sitemap
2. Create a config file
At the root of your project, add next-sitemap.config.js (or .ts). A minimal example:

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://example.com',
  generateRobotsTxt: true,  // whether to generate robots.txt
  // optionally more options below...
}
By default, generateRobotsTxt is false, so if you want a robots.txt, you must enable this.

3. Hook it into your build process
In your package.json:

{
  "scripts": {
    "build": "next build",
    "postbuild": "next-sitemap"
  }
}
So after the Next.js build step, the next-sitemap command runs to generate the sitemap(s) and robots.txt.

If you're using pnpm, due to how postbuild scripts are handled, you might also need a .npmrc file containing:

enable-pre-post-scripts=true
This ensures that the postbuild script runs properly.

4. Output placement & indexing
By default, the generated files go into your public/ folder (or your outDir) so that they are served statically.

next-sitemap v2+ uses an index sitemap by default: instead of one big sitemap.xml listing all URLs, you get sitemap.xml that references other sitemap-0.xml, sitemap-1.xml, etc., if split is needed.

If you prefer not to use an index sitemap (for simpler / small sites), you can disable index generation:

generateIndexSitemap: false
Configuration options: customizing lastmod, priority, changefreq, splitting, excludes, etc.
To make your sitemap more useful, next-sitemap offers many configuration options. Here are the common ones and how to use them.

Option	Purpose	Default	Example / notes
siteUrl	Base URL of your site (e.g. https://yourdomain.com)	—	Required
changefreq	Default <changefreq> for each URL (e.g. daily, weekly)	"daily"	You can also override per-path via transform function
priority	Default <priority> (0.0 to 1.0) for each URL	0.7	Also override per-path if needed
sitemapSize	Max number of URLs in a single sitemap file before splitting	5000	Set to e.g. 7000 to allow 7,000 URLs per file ([GitHub][1])
generateRobotsTxt	Whether to produce robots.txt file	false	If true, robots.txt will include sitemap(s) and your specified policies
exclude	List of path patterns (relative) to omit from sitemap	[]	e.g. ['/secret', '/admin/*']
alternateRefs	For multilingual / alternate URLs (hreflang) setup	[]	Provide alternate domain/hreflang pairs
transform	A custom function called for each path to allow modifying or excluding individual entries	—	If transform(...) returns null, the path is excluded; else return an object that can include loc, changefreq, priority, lastmod, alternateRefs etc. ([GitHub][1])
additionalPaths	A function returning extra paths to include in sitemap (beyond routes detected)	—	Useful if some pages are not part of route detection but still should be in sitemap ([GitHub][1])
robotsTxtOptions	Customization for robots.txt (policies, additionalSitemaps, includeNonIndexSitemaps)	—	See below for details
Example full config
Here is an example combining many features:

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://example.com',
  changefreq: 'weekly',
  priority: 0.8,
  sitemapSize: 7000,
  generateRobotsTxt: true,
  exclude: ['/secret', '/protected/*'],
  alternateRefs: [
    { href: 'https://es.example.com', hreflang: 'es' },
    { href: 'https://fr.example.com', hreflang: 'fr' }
  ],
  transform: async (config, path) => {
    // Suppose you want to exclude admin pages
    if (path.startsWith('/admin')) {
      return null
    }
    // For blog posts, boost priority
    if (path.startsWith('/blog/')) {
      return {
        loc: path,
        changefreq: 'daily',
        priority: 0.9,
        lastmod: new Date().toISOString(),
        alternateRefs: config.alternateRefs ?? []
      }
    }
    // default transformation
    return {
      loc: path,
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? []
    }
  },
  additionalPaths: async (config) => {
    // Suppose you have pages not automatically discovered
    return [
      await config.transform(config, '/extra-page'),
      {
        loc: '/promo',
        changefreq: 'monthly',
        priority: 0.6,
        lastmod: new Date().toISOString()
      }
    ]
  },
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/'
      },
      {
        userAgent: 'bad-bot',
        disallow: ['/private', '/user-data']
      }
    ],
    additionalSitemaps: [
      'https://example.com/my-extra-sitemap.xml'
    ],
    includeNonIndexSitemaps: false  // whether to include all sitemap endpoints
  }
}
That config would produce:

A sitemap index file (sitemap.xml) referencing sub-sitemaps.
Specific blog/* routes get higher priority and daily changefreq.
Admin pages get excluded entirely.
robots.txt that includes your custom policies and additional sitemaps.
Understanding lastmod, priority, changefreq
These three XML elements are often misunderstood. Here’s how they work and how next-sitemap uses them:

<lastmod>: Indicates when the page was last modified. With autoLastmod: true (default), next-sitemap will set it to the current timestamp (ISO) for all pages. You can override it per path in transform or via additionalPaths.
<priority>: A hint to search engines about the relative importance of pages (0.0 to 1.0). Though many engines treat it as advisory, it’s still useful to set more important pages higher.
<changefreq>: A hint about how often the page content changes (e.g. daily, weekly, hourly). It’s a signal, not a binding contract — search engines may ignore if they see no change.
In your config, you can set defaults and then override for specific paths.

Handling large sites: splitting sitemaps & indexing
If your site has many URLs (e.g. 10,000, 100,000), having a single sitemap.xml can be unwieldy. next-sitemap helps via:

sitemapSize: sets the max number of URLs per sitemap file. If exceeded, it automatically splits into multiple files (e.g. sitemap-0.xml, sitemap-1.xml).
Then it creates a “index sitemap” (sitemap.xml) which references all the sub-sitemaps.
If you don’t want that complexity, you can disable index mode with generateIndexSitemap: false.
This ensures your site’s sitemap stays manageable and within recommended limits.

Server-side / dynamic sitemap support (Next.js 13 / app directory)
One challenge: what if your site has many dynamic pages (e.g. blog posts fetched from a CMS) that aren’t known at build time? next-sitemap provides APIs to generate sitemaps at runtime via server routes.

These APIs include:

getServerSideSitemapIndex — to generate an index sitemap dynamically (for the “app directory” in Next 13)
getServerSideSitemap — to generate a sitemap (list of <url> entries) dynamically
Legacy versions (for pages directory) are also supported (e.g. getServerSideSitemapLegacy)
Example: dynamic index sitemap in app directory
Create a route file like app/server-sitemap-index.xml/route.ts:

import { getServerSideSitemapIndex } from 'next-sitemap'

export async function GET(request: Request) {
  // fetch your list of sitemap URLs or paths
  const urls = [
    'https://example.com/sitemap-0.xml',
    'https://example.com/sitemap-1.xml'
  ]
  return getServerSideSitemapIndex(urls)
}
Then in your next-sitemap.config.js, exclude '/server-sitemap-index.xml' from static generation, and add it to robotsTxtOptions.additionalSitemaps so that the generated robots.txt points to this dynamic index.

Example: dynamic sitemap generation
Similarly, for an actual sitemap of dynamic URLs:

In app/server-sitemap.xml/route.ts:

import { getServerSideSitemap } from 'next-sitemap'

export async function GET(request: Request) {
  const fields = [
    {
      loc: 'https://example.com/post/1',
      lastmod: new Date().toISOString(),
      // optionally, changefreq, priority
    },
    {
      loc: 'https://example.com/post/2',
      lastmod: new Date().toISOString()
    },
    // etc.
  ]
  return getServerSideSitemap(fields)
}
Again, exclude '/server-sitemap.xml' in your static config and add it to robotsTxtOptions.additionalSitemaps.

This way, your dynamic content remains discoverable by crawlers even if not known at build time.

robots.txt: policies, inclusion, additional sitemaps
When generateRobotsTxt: true, next-sitemap will generate a robots.txt file for your site (placed under public/). Some details:

By default, it will allow all paths to all user agents (User-agent: * Allow: /) unless you override.
It will include the Sitemap: … line(s), pointing to your index sitemap (or multiple sitemaps) so that crawlers know where to look.
You can customize via robotsTxtOptions:

policies: an array of policy objects, e.g.:
[
  { userAgent: '*', allow: '/' },
  { userAgent: 'special-bot', disallow: ['/secret'] }
]
additionalSitemaps: If you have other sitemaps not auto-generated by next-sitemap (for example an external sitemap), you can include them.
includeNonIndexSitemaps: from version 2.4.x onwards, this toggles whether all sitemap endpoints (not just the index) are listed in the robots.txt. Setting it to false helps avoid duplicate submissions (index → sub-sitemaps → repeated).
Sample robots.txt output
With a config like:

robotsTxtOptions: {
  policies: [
    { userAgent: '*', allow: '/' },
    { userAgent: 'bad-bot', disallow: ['/private'] }
  ],
  additionalSitemaps: ['https://example.com/my-custom-sitemap.xml']
}
You might get:

# 
User-agent: *
Allow: /

# bad-bot
User-agent: bad-bot
Disallow: /private

# Host
Host: https://example.com

# Sitemaps
Sitemap: https://example.com/sitemap.xml
Sitemap: https://example.com/my-custom-sitemap.xml
Example end-to-end: sample Next.js / next-sitemap workflow
Putting it all together, here’s a possible workflow:

Install next-sitemap in your Next.js project.
Create next-sitemap.config.js with settings and customize as needed (site URL, policies, exclusions, transforms).
Add postbuild: next-sitemap in your build script so sitemaps and robots are generated after building.
If you have dynamic content not known at build time, add server-side routes using getServerSideSitemap / getServerSideSitemapIndex.
Exclude those dynamic sitemap paths from static generation in config, and include them in robotsTxtOptions.additionalSitemaps.
Deploy your site. The generated sitemap.xml, sitemap-0.xml, etc., and robots.txt are publicly accessible (e.g. https://yourdomain.com/robots.txt).
Submit your sitemap.xml (or index) to Google Search Console / Bing Webmaster, so search engines know where to crawl from.

________

## NEXT-SITEMAP DOC:

Table of contents
Getting started
Installation
Create config file
Building sitemaps
Custom config file
Building sitemaps with pnpm
Index sitemaps
Splitting large sitemap into multiple files
Configuration Options
Custom transformation function
Full configuration example
Generating dynamic/server-side sitemaps
Typescript JSDoc
Getting started
Installation
yarn add next-sitemap
Create config file
next-sitemap requires a basic config file (next-sitemap.config.js) under your project root

✅ next-sitemap will load environment variables from .env files by default.

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://example.com',
  generateRobotsTxt: true, // (optional)
  // ...other options
}
Building sitemaps
Add next-sitemap as your postbuild script

{
  "build": "next build",
  "postbuild": "next-sitemap"
}
Custom config file
You can also use a custom config file instead of next-sitemap.config.js. Just pass --config <your-config-file>.js to build command (Example: custom-config-file)

{
  "build": "next build",
  "postbuild": "next-sitemap --config awesome.config.js"
}
Building sitemaps with pnpm
When using pnpm you need to create a .npmrc file in the root of your project if you want to use a postbuild step:

//.npmrc
enable-pre-post-scripts=true
Index sitemaps (Optional)
📣 From next-sitemap v2.x onwards, sitemap.xml will be Index Sitemap. It will contain urls of all other generated sitemap endpoints.

Index sitemap generation can be turned off by setting generateIndexSitemap: false in next-sitemap config file. (This is useful for small/hobby sites which does not require an index sitemap) (Example: no-index-sitemaps)

Splitting large sitemap into multiple files
Define the sitemapSize property in next-sitemap.config.js to split large sitemap into multiple files.

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://example.com',
  generateRobotsTxt: true,
  sitemapSize: 7000,
}
Above is the minimal configuration to split a large sitemap. When the number of URLs in a sitemap is more than 7000, next-sitemap will create sitemap (e.g. sitemap-0.xml, sitemap-1.xml) and index (e.g. sitemap.xml) files.

Configuration Options
property	description	type
siteUrl	Base url of your website	string
output (optional)	Next.js output modes. Check documentation.	standalone, export
changefreq (optional)	Change frequency. Default daily	string
priority (optional)	Priority. Default 0.7	number
sitemapBaseFileName (optional)	The name of the generated sitemap file before the file extension. Default "sitemap"	string
alternateRefs (optional)	Denote multi-language support by unique URL. Default []	AlternateRef[]
sitemapSize(optional)	Split large sitemap into multiple files by specifying sitemap size. Default 5000	number
autoLastmod (optional)	Add <lastmod/> property. Default true	true
exclude (optional)	Array of relative paths (wildcard pattern supported) to exclude from listing on sitemap.xml or sitemap-*.xml. e.g.: ['/page-0', '/page-*', '/private/*'].

Apart from this option next-sitemap also offers a custom transform option which could be used to exclude urls that match specific patterns	string[]
sourceDir (optional)	next.js build directory. Default .next	string
outDir (optional)	All the generated files will be exported to this directory. Default public	string
transform (optional)	A transformation function, which runs for each relative-path in the sitemap. Returning null value from the transformation function will result in the exclusion of that specific path from the generated sitemap list.	async function
additionalPaths (optional)	Async function that returns a list of additional paths to be added to the generated sitemap list.	async function
generateIndexSitemap	Generate index sitemaps. Default true	boolean
generateRobotsTxt (optional)	Generate a robots.txt file and list the generated sitemaps. Default false	boolean
robotsTxtOptions.transformRobotsTxt (optional)	Custom robots.txt transformer function. (Example: custom-robots-txt-transformer)

Default: async(config, robotsTxt)=> robotsTxt	async function
robotsTxtOptions.policies (optional)	Policies for generating robots.txt.

Default:
[{ userAgent: '*', allow: '/' }]	IRobotPolicy[]
robotsTxtOptions.additionalSitemaps (optional)	Options to add additional sitemaps to robots.txt host entry	string[]
robotsTxtOptions.includeNonIndexSitemaps (optional)	From v2.4x onwards, generated robots.txt will only contain url of index sitemap and custom provided endpoints from robotsTxtOptions.additionalSitemaps.

This is to prevent duplicate url submission (once through index-sitemap -> sitemap-url and once through robots.txt -> HOST)

Set this option true to add all generated sitemap endpoints to robots.txt

Default false (Recommended)	boolean
Custom transformation function
Custom transformation provides an extension method to add, remove or exclude path or properties from a url-set. Transform function runs for each relative path in the sitemap. And use the key: value object to add properties in the XML.

Returning null value from the transformation function will result in the exclusion of that specific relative-path from the generated sitemap list.

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  transform: async (config, path) => {
    // custom function to ignore the path
    if (customIgnoreFunction(path)) {
      return null
    }

    // only create changefreq along with path
    // returning partial properties will result in generation of XML field with only returned values.
    if (customLimitedField(path)) {
      // This returns `path` & `changefreq`. Hence it will result in the generation of XML field with `path` and  `changefreq` properties only.
      return {
        loc: path, // => this will be exported as http(s)://<config.siteUrl>/<path>
        changefreq: 'weekly',
      }
    }

    // Use default transformation for all other cases
    return {
      loc: path, // => this will be exported as http(s)://<config.siteUrl>/<path>
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
}
Additional paths function
additionalPaths this function can be useful if you have a large list of pages, but you don't want to render them all and use fallback: true. Result of executing this function will be added to the general list of paths and processed with sitemapSize. You are free to add dynamic paths, but unlike additionalSitemap, you do not need to split the list of paths into different files in case there are a lot of paths for one file.

If your function returns a path that already exists, then it will simply be updated, duplication will not happen.

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  additionalPaths: async (config) => {
    const result = []

    // required value only
    result.push({ loc: '/additional-page-1' })

    // all possible values
    result.push({
      loc: '/additional-page-2',
      changefreq: 'yearly',
      priority: 0.7,
      lastmod: new Date().toISOString(),

      // acts only on '/additional-page-2'
      alternateRefs: [
        {
          href: 'https://es.example.com',
          hreflang: 'es',
        },
        {
          href: 'https://fr.example.com',
          hreflang: 'fr',
        },
      ],
    })

    // using transformation from the current configuration
    result.push(await config.transform(config, '/additional-page-3'))

    return result
  },
}
Google News, image and video sitemap
Url set can contain additional sitemaps defined by google. These are Google News sitemap, image sitemap or video sitemap. You can add the values for these sitemaps by updating entry in transform function or adding it with additionalPaths. You have to return a sitemap entry in both cases, so it's the best place for updating the output. This example will add an image and news tag to each entry but IRL you would of course use it with some condition or within additionalPaths result.

/** @type {import('next-sitemap').IConfig} */
const config = {
  transform: async (config, path) => {
    return {
      loc: path, // => this will be exported as http(s)://<config.siteUrl>/<path>
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      images: [{ loc: 'https://example.com/image.jpg' }],
      news: {
        title: 'Article 1',
        publicationName: 'Google Scholar',
        publicationLanguage: 'en',
        date: new Date(),
      },
    }
  },
}

export default config
Full configuration example
Here's an example next-sitemap.config.js configuration with all options

/** @type {import('next-sitemap').IConfig} */

module.exports = {
  siteUrl: 'https://example.com',
  changefreq: 'daily',
  priority: 0.7,
  sitemapSize: 5000,
  generateRobotsTxt: true,
  exclude: ['/protected-page', '/awesome/secret-page'],
  alternateRefs: [
    {
      href: 'https://es.example.com',
      hreflang: 'es',
    },
    {
      href: 'https://fr.example.com',
      hreflang: 'fr',
    },
  ],
  // Default transformation function
  transform: async (config, path) => {
    return {
      loc: path, // => this will be exported as http(s)://<config.siteUrl>/<path>
      changefreq: config.changefreq,
      priority: config.priority,
      lastmod: config.autoLastmod ? new Date().toISOString() : undefined,
      alternateRefs: config.alternateRefs ?? [],
    }
  },
  additionalPaths: async (config) => [
    await config.transform(config, '/additional-page'),
  ],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
      {
        userAgent: 'test-bot',
        allow: ['/path', '/path-2'],
      },
      {
        userAgent: 'black-listed-bot',
        disallow: ['/sub-path-1', '/path-2'],
      },
    ],
    additionalSitemaps: [
      'https://example.com/my-custom-sitemap-1.xml',
      'https://example.com/my-custom-sitemap-2.xml',
      'https://example.com/my-custom-sitemap-3.xml',
    ],
  },
}
Above configuration will generate sitemaps based on your project and a robots.txt like this.

# *
User-agent: *
Allow: /

# test-bot
User-agent: test-bot
Allow: /path
Allow: /path-2

# black-listed-bot
User-agent: black-listed-bot
Disallow: /sub-path-1
Disallow: /path-2

# Host
Host: https://example.com

# Sitemaps
Sitemap: https://example.com/sitemap.xml # Index sitemap
Sitemap: https://example.com/my-custom-sitemap-1.xml
Sitemap: https://example.com/my-custom-sitemap-2.xml
Sitemap: https://example.com/my-custom-sitemap-3.xml
Generating dynamic/server-side sitemaps
next-sitemap now provides two APIs to generate server side sitemaps. This will help to dynamically generate index-sitemap(s) and sitemap(s) by sourcing data from CMS or custom source.

getServerSideSitemapIndex: Generates index sitemaps based on urls provided and returns application/xml response. Supports next13+ route.{ts,js} file.

To continue using inside pages directory, import getServerSideSitemapIndexLegacy instead.
getServerSideSitemap: Generates sitemap based on field entires and returns application/xml response. Supports next13+ route.{ts,js} file.

To continue using inside pages directory, import getServerSideSitemapLegacy instead.
Server side index-sitemaps (getServerSideSitemapIndex)
Here's a sample script to generate index-sitemap on server side.

1. Index sitemap (app directory)
2. Index sitemap (pages directory) (legacy)
Exclude server index sitemap from robots.txt
Now, next.js is serving the dynamic index-sitemap from http://localhost:3000/server-sitemap-index.xml.

List the dynamic sitemap page in robotsTxtOptions.additionalSitemaps and exclude this path from static sitemap list.

// next-sitemap.config.js

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://example.com',
  generateRobotsTxt: true,
  exclude: ['/server-sitemap-index.xml'], // <= exclude here
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://example.com/server-sitemap-index.xml', // <==== Add here
    ],
  },
}
In this way, next-sitemap will manage the sitemaps for all your static pages and your dynamic index-sitemap will be listed on robots.txt.

server side sitemap (getServerSideSitemap)
Here's a sample script to generate sitemaps on server side.

1. Sitemaps (app directory)
2. Sitemaps (pages directory) (legacy)
Now, next.js is serving the dynamic sitemap from http://localhost:3000/server-sitemap.xml.

List the dynamic sitemap page in robotsTxtOptions.additionalSitemaps and exclude this path from static sitemap list.

// next-sitemap.config.js

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://example.com',
  generateRobotsTxt: true,
  exclude: ['/server-sitemap.xml'], // <= exclude here
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://example.com/server-sitemap.xml', // <==== Add here
    ],
  },
}
In this way, next-sitemap will manage the sitemaps for all your static pages and your dynamic sitemap will be listed on robots.txt.

Typescript JSDoc
Add the following line of code in your next-sitemap.config.js for nice typescript autocomplete! 💖

/** @type {import('next-sitemap').IConfig} */
module.exports = {
  // YOUR CONFIG
}

_______

## GOOGLE NEWSSITEMAP DOC

News sitemaps

bookmark_border
If you are a news publisher, use news sitemaps to tell Google about your news articles and additional information about them. You can either extend your existing sitemap with news specific tags, or create a separate news sitemap that's reserved just for your news articles. Either option is fine with Google, however creating a separate sitemap just for your news articles may enable better tracking of your content in Search in Search Console.

News sitemap best practices
News sitemaps are based on generic sitemaps, so the general sitemap best practices also apply to news sitemaps.

Update your news sitemap with fresh articles as they're published. Don't create a new sitemap with each update. Google News crawls news sitemaps as often as it crawls the rest of your site.

Only include recent URLs for articles that were created in the last two days. Once the articles are older than two days, either remove those URLs from the news sitemap or remove the <news:news> metadata in your sitemap from the older URLs.

If you choose the method of removing old URLs from your news sitemap, this could mean that your sitemap becomes empty for a period of time (for example, if you haven't published articles in the last few days). You may see an Empty Sitemap warning in Search Console, but this is just to make sure it was intentional on your behalf. It won't cause any problems with Google Search if the file is empty.

Example news sitemap
The following example shows a regular sitemap with news extension. It contains one <url> tag and a single <news:news> tag with its required child tags:


<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
  <url>
  <loc>http://www.example.org/business/article55.html</loc>
  <news:news>
    <news:publication>
      <news:name>The Example Times</news:name>
      <news:language>en</news:language>
    </news:publication>
    <news:publication_date>2008-12-23</news:publication_date>
    <news:title>Companies A, B in Merger Talks</news:title>
  </news:news>
  </url>
</urlset>
News sitemap reference
The news tags are defined in the news sitemap namespace: http://www.google.com/schemas/sitemap-news/0.9

To make sure Google can use your news sitemap, you must use the following required tags:

Required tags
<news:news>	The parent tag of other tags in the news: namespace. Each url sitemap tag can have only one news:news tag (plus the respective closing tag) and a sitemap may have up to 1,000 news:news tags. If there are more than 1,000 <news:news> tags in a news sitemap, split your sitemap into several smaller sitemaps.
<news:publication>	
The parent tag for the <news:name> and <news:language> tags. Each <news:news> parent tag may only have one <news:publication> tag.

<news:name>	
The <news:name> tag is the name of the news publication. It must exactly match the name as it appears on your articles on news.google.com, omitting anything in parentheses.

<news:language>	
The <news:language> tag is the language of your publication. Use an ISO 639 language code (two or three letters).

Exception: For Simplified Chinese, use zh-cn and for Traditional Chinese, use zh-tw.

<news:publication_date>	
The article publication date in W3C format. Use either the "complete date" format (YYYY-MM-DD) or the "complete date plus hours, minutes, and seconds" format with time zone designator format (YYYY-MM-DDThh:mm:ssTZD). Specify the original date and time when the article was first published on your site. Don't specify the time when you added the article to your sitemap.

Google accepts any of the following formats:

Complete date: YYYY-MM-DD (1997-07-16)
Complete date plus hours and minutes: YYYY-MM-DDThh:mmTZD (1997-07-16T19:20+01:00)
Complete date plus hours, minutes, and seconds: YYYY-MM-DDThh:mm:ssTZD (1997-07-16T19:20:30+01:00)
Complete date plus hours, minutes, seconds, and a decimal fraction of a second: YYYY-MM-DDThh:mm:ss.sTZD (1997-07-16T19:20:30.45+01:00)
<news:title>	
The title of the news article.

Tip: Google may shorten the title of the news article for space reasons when displaying the article on various devices. Include the title of the article as it appears on your site. Don't include the author name, publication name, or publication date in the <news:title> tag. Learn more about creating better titles.
Troubleshooting sitemaps
If you're having trouble with your sitemap, you can investigate the errors with Google Search Console. See Search Console's sitemaps troubleshooting guide for help.