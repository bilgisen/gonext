import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { fetchTrendingArticles } from '@/lib/api/trending';
import { formatDistanceToNow } from 'date-fns';

export default async function TrendingArticlesServer() {
  const articles = await fetchTrendingArticles(6);

  if (!articles?.length) return null;

  return (
    <div className="space-y-4 sticky">
      <h2 className="text-xl font-bold">Trending Now</h2>
      <Separator className="my-2" />
      <div className="space-y-3">
        {articles.map((a, i) => (
          <div key={a.id} className="border-b pb-3 last:border-b-0">
            <Link href={`/news/${a.slug}`} className="block hover:opacity-80">
              <div className="flex items-start gap-3">
                <span className="text-lg font-bold text-muted-foreground/70">
                  {i + 1}.
                </span>
                <div>
                  <h3 className="font-medium line-clamp-2">{a.title}</h3>
                  <div className="flex items-center text-sm text-muted-foreground/50 mt-1">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    <span>
                      {formatDistanceToNow(new Date(a.published_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
