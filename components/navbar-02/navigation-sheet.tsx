"use client";

import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Menu } from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo";
import { NavMenu } from "./nav-menu";

export const NavigationSheet = () => {
  const [open, setOpen] = useState(false);
  
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <VisuallyHidden>
        <SheetTitle>Navigation Menu</SheetTitle>
      </VisuallyHidden>

      <SheetTrigger asChild>
        <button 
          className="md:hidden p-2 text-foreground hover:text-foreground/80 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-72 p-0 bg-background border-r border-border"
      >
        <div className="p-4 border-b border-border">
          <Logo />
        </div>
        <NavMenu 
          orientation="vertical" 
          className="p-2" 
          onNavItemClick={() => setOpen(false)} 
        />
      </SheetContent>
    </Sheet>
  );
};
