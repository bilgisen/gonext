import { Button } from "@/components/ui/button";
import { Logo } from "./logo";
import { NavMenu } from "./nav-menu";
import { NavigationSheet } from "./navigation-sheet";
import { SunIcon } from "lucide-react";

const Navbar02Page = () => {
  return (
    <div className="min-h-screen">
      <nav className="h-16 bg-amber-500 border-b">
        <div className="h-full flex items-center justify-between max-w-(--breakpoint-xl) mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-12">
            <Logo />

            {/* Desktop Menu */}
            <NavMenu className="hidden md:block" />
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="hidden sm:inline-flex">
              Sign In
            </Button>
            <Button>Sign Up</Button>
            <Button size="icon" variant="outline">
              <SunIcon />
            </Button>

            {/* Mobile Menu */}
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
