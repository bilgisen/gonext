'use client';

import { createContext, useContext, useState, ReactNode, useCallback, useMemo } from 'react';

type DisplayedNewsMap = Map<string, Set<string>>; // category -> Set of news IDs

type NewsContextType = {
  displayedNews: DisplayedNewsMap;
  addDisplayedNews: (category: string, ids: string[]) => void;
  resetDisplayedNews: (category?: string) => void;
};

const NewsContext = createContext<NewsContextType | undefined>(undefined);

export function NewsProvider({ children }: { children: ReactNode }) {
  const [displayedNews, setDisplayedNews] = useState<DisplayedNewsMap>(new Map());

  const addDisplayedNews = useCallback((category: string, ids: string[]) => {
    if (!category || !ids || !Array.isArray(ids) || ids.length === 0) {
      console.log('addDisplayedNews: Invalid input', { category, ids });
      return;
    }
    
    const validIds = ids.filter(Boolean);
    if (validIds.length === 0) {
      console.log('addDisplayedNews: No valid IDs to add');
      return;
    }
    
    console.log(`addDisplayedNews: Adding ${validIds.length} items to category '${category}'`, validIds);
    
    setDisplayedNews(prev => {
      const newMap = new Map(prev);
      const categorySet = newMap.get(category) || new Set<string>();
      
      const newIds = validIds.filter(id => !categorySet.has(id));
      if (newIds.length === 0) {
        console.log('No new items to add - all items already exist in this category');
        return prev;
      }
      
      console.log(`Adding ${newIds.length} new items to category '${category}':`, newIds);
      
      // Add all new IDs to the set
      newIds.forEach(id => categorySet.add(id));
      newMap.set(category, categorySet);
      
      console.log(`Updated displayedNews for '${category}':`, Array.from(categorySet));
      return newMap;
    });
  }, []);

  const resetDisplayedNews = useCallback((category?: string) => {
    if (category) {
      console.log(`resetDisplayedNews: Resetting category '${category}'`);
      setDisplayedNews(prev => {
        // Only reset if the category exists to avoid unnecessary re-renders
        if (!prev.has(category)) {
          console.log(`Category '${category}' not found in displayedNews`);
          return prev;
        }
        
        const newMap = new Map(prev);
        newMap.delete(category);
        console.log(`Reset category '${category}'. Remaining categories:`, Array.from(newMap.keys()));
        return newMap;
      });
    } else {
      console.log('resetDisplayedNews: Resetting all categories');
      setDisplayedNews(new Map());
    }
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    displayedNews,
    addDisplayedNews,
    resetDisplayedNews
  }), [displayedNews, addDisplayedNews, resetDisplayedNews]);

  return (
    <NewsContext.Provider value={contextValue}>
      {children}
    </NewsContext.Provider>
  );
}

export function useNewsContext() {
  const context = useContext(NewsContext);
  if (context === undefined) {
    throw new Error('useNewsContext must be used within a NewsProvider');
  }
  return context;
}
