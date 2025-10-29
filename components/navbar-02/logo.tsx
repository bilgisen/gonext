import { Rss} from 'lucide-react';
import Link from 'next/link';

export const Logo = () => (
  <Link href="/" className="flex items-center gap-2">
    <span className="text-xl font-bold text-foreground">
      Kiosk
    </span>
    <Rss className="h-4 w-4 text-foreground" />
  </Link>
);
