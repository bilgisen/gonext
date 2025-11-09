import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import { ComponentProps } from "react";

interface NavMenuProps extends ComponentProps<typeof NavigationMenu> {
  onNavItemClick?: () => void;
}

export const NavMenu = ({ onNavItemClick, className, ...props }: NavMenuProps) => (
  <NavigationMenu {...props} className={className}>
    <NavigationMenuList className="flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-1 w-full">
      <NavigationMenuItem>
        <Link 
          href="/turkiye" 
          className="block px-4 py-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          onClick={onNavItemClick}
        >
          Türkiye
        </Link>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <Link 
          href="/business" 
          className="block px-4 py-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          onClick={onNavItemClick}
        >
          Business
        </Link>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <Link 
          href="/world" 
          className="block px-4 py-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          onClick={onNavItemClick}
        >
          World
        </Link>
      </NavigationMenuItem>
     
            <NavigationMenuItem>
        <Link 
          href="/technology" 
          className="block px-4 py-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          onClick={onNavItemClick}
        >
          Technology
        </Link>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <Link 
          href="/culture" 
          className="block px-4 py-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          onClick={onNavItemClick}
        >
          Arts & Culture
        </Link>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <Link 
          href="/sports" 
          className="block px-4 py-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
          onClick={onNavItemClick}
        >
          Sports
        </Link>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);
