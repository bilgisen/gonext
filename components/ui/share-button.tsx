'use client';

import { useState } from 'react';
import { 
  Share2, 
  Link as LinkIcon,
  Facebook, 
  Twitter, 
  Linkedin, 
  MessageSquare,
  Send
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './dropdown-menu';

interface ShareButtonProps {
  className?: string;
  iconClassName?: string;
  title?: string;
  text?: string;
  url?: string;
}

const socialPlatforms = [
  { 
    platform: 'twitter', 
    label: 'Twitter', 
    icon: <Twitter size={16} className="text-blue-400" />,
    className: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
  },
  { 
    platform: 'facebook', 
    label: 'Facebook', 
    icon: <Facebook size={16} className="text-blue-600" />,
    className: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
  },
  { 
    platform: 'linkedin', 
    label: 'LinkedIn', 
    icon: <Linkedin size={16} className="text-blue-700" />,
    className: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
  },
  { 
    platform: 'whatsapp', 
    label: 'WhatsApp', 
    icon: <MessageSquare size={16} className="text-green-500" />,
    className: 'hover:bg-green-50 dark:hover:bg-green-900/20'
  },
  { 
    platform: 'telegram', 
    label: 'Telegram', 
    icon: <Send size={16} className="text-blue-400" />,
    className: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
  },
];

export default function ShareButton({ 
  className = '',
  iconClassName = 'w-4 h-4 text-muted-foreground hover:text-primary transition-colors',
  title = '',
  text = '',
  url = ''
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  };

  const shareToSocial = (platform: string) => {
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedTitle = encodeURIComponent(title);
    const encodedText = text ? encodeURIComponent(text) : '';
    
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${encodedText ? `%0A%0A${encodedText}` : ''}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}${encodedText ? `&quote=${encodedText}` : ''}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}${encodedText ? `&summary=${encodedText}` : ''}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%0A%0A${encodedText ? `${encodedText}%0A%0A` : ''}${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}${encodedText ? `%0A%0A${encodedText}` : ''}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className={`p-0.5 ${className}`}
          aria-label="Share"
        >
          <Share2 className={iconClassName} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48 p-1.5 text-sm" align="end">
        <DropdownMenuItem 
          onClick={copyToClipboard}
          className="flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer hover:bg-primary/10"
        >
          {copied ? (
            <>
              <LinkIcon size={16} className="text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <LinkIcon size={16} className="text-muted-foreground" />
              <span>Copy Link</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {socialPlatforms.map(({ platform, label, icon, className: itemClassName }) => (
          <DropdownMenuItem 
            key={platform}
            onClick={() => shareToSocial(platform)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded cursor-pointer ${itemClassName}`}
          >
            {icon}
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
