'use client';

import { useState } from 'react';
import { 
  Share2, 
  Check, 
  Copy,
  MessageSquare,
  Twitter,
  Facebook,
  Linkedin,
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
  title: string;
  text?: string;
  url?: string;
  className?: string;
}

export default function ShareButton({ 
  title, 
  text, 
  url,
  className = '' 
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error('Kopyalama hatası:', err);
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
          className={`inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent transition-colors ${className}`}
          aria-label="Share"
        >
          <Share2 className="h-5 w-5 text-foreground/80 hover:text-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 p-2" align="end">
        {/* Link Kopyalama */}
        <DropdownMenuItem 
          onClick={copyToClipboard}
          className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent text-foreground"
        >
          {copied ? (
            <>
              <Check size={20} className="text-green-600" />
              <span className="text-green-600 dark:text-green-500">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={20} className="text-foreground/80" />
              <span className="text-foreground">Copy Link</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/* Sosyal Medya Butonları */}
        <DropdownMenuItem 
          onClick={() => shareToSocial('whatsapp')}
          className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent text-foreground"
        >
          <MessageSquare className="w-5 h-5 text-green-500" />
          <span className="text-foreground">WhatsApp</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => shareToSocial('twitter')}
          className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent text-foreground"
        >
          <Twitter className="w-5 h-5 text-black" />
          <span className="text-foreground">X (Twitter)</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => shareToSocial('facebook')}
          className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent text-foreground"
        >
          <Facebook className="w-5 h-5 text-blue-600" />
          <span className="text-foreground">Facebook</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => shareToSocial('linkedin')}
          className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent text-foreground"
        >
          <Linkedin className="w-5 h-5 text-blue-700" />
          <span className="text-foreground">LinkedIn</span>
        </DropdownMenuItem>

        <DropdownMenuItem 
          onClick={() => shareToSocial('telegram')}
          className="flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer hover:bg-accent text-foreground"
        >
          <Send className="w-5 h-5 text-blue-400" />
          <span className="text-foreground">Telegram</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
