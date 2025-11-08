import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { NavMenu } from "./nav-menu";
import { NavigationSheet } from "./navigation-sheet";
import { SunIcon } from "lucide-react";

const Navbar02Page = () => {
  return (
    <div className="min-h-screen">
      <nav className="h-16 border-b">
        <div className="h-full flex items-center justify-between max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-12">
            <Logo />

            {/* Desktop Menu - Hidden on mobile */}
            <div className="hidden md:block">
              <NavMenu />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Desktop Buttons - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-3">
              <Button variant="outline">
                Sign In
              </Button>
              <Button>Sign Up</Button>
              <Button size="icon" variant="outline">
                <SunIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Mobile Menu Button - Only shows on mobile */}
            <div className="md:hidden ml-2">
              <NavigationSheet />
            </div>
          </div>
        </div>
        </nav>
    </div>
  );
};

export default Navbar02Page;
