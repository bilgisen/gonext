'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MarkdownRendererProps {
  children: string;
  className?: string;
}

interface CodeProps extends React.HTMLAttributes<HTMLElement> {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function MarkdownRenderer({ children, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code({ node, inline, className, children, ...props }: CodeProps) {
            const match = /language-(\w+)/.exec(className || '');
            
            if (!inline && match) {
              return (
                <div className="relative">
                  <pre 
                    className={`bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm`}
                    {...props}
                  >
                    <code className={`language-${match[1]}`}>
                      {children}
                    </code>
                  </pre>
                  <div className="absolute top-2 right-2 text-xs text-gray-400">
                    {match[1]}
                  </div>
                </div>
              );
            }
            
            return (
              <code 
                className={`${className || ''} bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm`} 
                {...props}
              >
                {children}
              </code>
            );
          },
          img: ({ node, ...props }) => (
            <div className="my-4">
              <img 
                className="rounded-lg shadow-lg w-full h-auto" 
                alt={props.alt || ''} 
                {...props} 
              />
              {props.title && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                  {props.title}
                </p>
              )}
            </div>
          ),
          a: ({ node, ...props }) => (
            <a 
              className="text-blue-600 dark:text-blue-400 hover:underline" 
              target="_blank" 
              rel="noopener noreferrer"
              {...props}
            />
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;
