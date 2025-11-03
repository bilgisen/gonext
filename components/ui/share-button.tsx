'use client';

import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

import { X, Facebook, Linkedin, MessageSquare, Share2 } from 'lucide-react';

type ShareVariant = 'small' | 'large';

interface ShareButtonProps {
  url: string;
  title?: string;
  description?: string;
  className?: string;
  variant?: ShareVariant;
}

const ShareButton: React.FC<ShareButtonProps> = ({ 
  url, 
  title = '', 
  description = '',
  className = '',
  variant = 'small'
}) => {
  const shareToX = () => {
    // Twitter (X) prefers title + URL format
    const text = title || '';
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const shareToFacebook = () => {
    // Facebook can handle Open Graph meta tags, we just need to pass the URL
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(title || '')}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const shareToLinkedIn = () => {
    // LinkedIn can handle Open Graph meta tags, we can include title and summary
    const shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title || '')}&summary=${encodeURIComponent(description || '')}`;
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const shareToWhatsApp = () => {
    // For WhatsApp, we'll use the web version which works on both mobile and desktop
    const text = `${title || ''}%0A%0A${description || ''}%0A%0A${url}`;
    const shareUrl = `https://web.whatsapp.com/send?text=${text}`;
    // Fallback to WhatsApp Web if the app doesn't open
    setTimeout(() => {
      window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
    }, 300);
    window.open(shareUrl, '_blank', 'noopener,noreferrer');
  };

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: description,
          url: url,
        });
      } catch (err) {
        console.log("Native share failed or was cancelled:", err);
      }
    }
  };

  // Share buttons for the large variant
  const shareButtons = [
    { 
      name: 'X', 
      icon: <X className="h-4 w-4" />, 
      onClick: shareToX 
    },
    { 
      name: 'Facebook', 
      icon: <Facebook className="h-4 w-4" />, 
      onClick: shareToFacebook 
    },
    { 
      name: 'LinkedIn', 
      icon: <Linkedin className="h-4 w-4" />, 
      onClick: shareToLinkedIn 
    },
    { 
      name: 'WhatsApp', 
      icon: <MessageSquare className="h-4 w-4" />, 
      onClick: shareToWhatsApp 
    },
  ];

  if (variant === 'large') {
    return (
      <div className={`flex items-center ${className}`}>
        <div className="flex items-center gap-3">
          {shareButtons.map((button) => (
            <Button
              key={button.name}
              variant="outline"
              size="sm"
              className="h-10 w-10 p-0 flex items-center justify-center"
              onClick={button.onClick}
              title={`Share on ${button.name}`}
              aria-label={`Share on ${button.name}`}
            >
              {React.cloneElement(button.icon, { className: 'h-5 w-5' })}
              <span className="sr-only">Share on {button.name}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  // Default small variant (dropdown)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`p-1 h-auto ${className}`}>
          <Share2 className="h-4 w-4" />
          <span className="sr-only">Paylaş</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={nativeShare} className="cursor-pointer">
          Share (Native)
        </DropdownMenuItem>
        {shareButtons.map((button) => (
          <DropdownMenuItem 
            key={button.name}
            onClick={button.onClick} 
            className="cursor-pointer"
          >
            {button.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ShareButton;
