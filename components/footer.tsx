import { Separator } from "@/components/ui/separator";
import {
  GithubIcon,
  LinkedinIcon,
  TwitterIcon,
  FacebookIcon,
  InstagramIcon,
  YoutubeIcon,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "./navbar-02/logo";
import { InstallButton } from "./pwa/install-button";

const footerSections = [
  {
    title: "Türkiye",
    href: "/turkiye", // Adjusted for English
    links: [
      { title: "Istanbul", href: "/tag/istanbul" },
      { title: "Ankara", href: "/tag/ankara" },
      { title: "Izmir", href: "/tag/izmir" },

    ],
  },
  {
    title: "Business",
    href: "/business",
    links: [
      { title: "Economy", href: "/topic/economy" },
      { title: "Finance", href: "/topic/finance" },
      { title: "Markets", href: "/topic/stock-exchange" },
    ],
  },
  {
    title: "World",
    href: "/world",
    links: [
      { title: "EU", href: "/topic/eu" },
      { title: "Middle East", href: "/topic/middle-east" },
      { title: "USA", href: "/topic/usa" },
    ],
  },
  {
    title: "Technology",
    href: "/technology",
    links: [
      { title: "Google", href: "/tag/google" },
      { title: "AI", href: "/topic/ai" },
      { title: "Apple", href: "/tag/apple" },
    ],
  },
  {
    title: "Sports",
    href: "/sports",
    links: [
      { title: "Fenerbahçe", href: "/tag/fenerbahce" },
      { title: "Beşiktaş", href: "/tag/besiktas" },
      { title: "Galatasaray", href: "/tag/galatasaray" },
    ],
  },
  {
    title: "Entertainment",
    href: "/entertainment",
    links: [
      { title: "Cinema", href: "/topic/cinema" },
      { title: "Music", href: "/topic/music" },
      { title: "Series", href: "/topic/series" },
    ],
  },
];

const socialLinks = [
  { icon: TwitterIcon, href: "#" },
  { icon: LinkedinIcon, href: "#" },
  { icon: FacebookIcon, href: "#" },
  { icon: GithubIcon, href: "#" },
  { icon: InstagramIcon, href: "#" },
  { icon: YoutubeIcon, href: "#" },
];

const Footer = () => {
  return (
    <div className="flex flex-col">
      <div className="grow bg-muted" />
      <footer className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="w-full">
          {/* Logo and Description Section - Moved to top */}
          <div className="py-8 px-6 xl:px-0 border-b">
            <div className="max-w-2xl">
              <Logo />
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                Stay updated with the latest news and insights.
              </p>
            </div>
          </div>
          
          <div className="py-12 grid grid-cols-3 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-x-4 sm:gap-x-8 gap-y-10 px-4 sm:px-6 xl:px-0">

            {/* Dynamic Footer Sections */}
            {footerSections.map((section) => (
              <div key={section.title}>
                <h6 className="font-semibold text-foreground tracking-tight">
                  <Link
                    href={section.href}
                    className="inline-block hover:underline"
                  >
                    {section.title}
                  </Link>
                </h6>
                <ul className="mt-2 space-y-1">
                  {section.links.map((link) => (
                    <li key={link.title}>
                      <Link
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
                      >
                        {link.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

          </div>
          <Separator />
          <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
            <div className="flex items-center gap-4">
              <InstallButton />
              <span className="text-muted-foreground text-sm">
                &copy; {new Date().getFullYear()}{" "}
                <Link href="/" className="hover:underline">
                  News Portal
                </Link>
                . All rights reserved.
              </span>
            </div>

            <div className="flex items-center gap-5 text-muted-foreground">
              {socialLinks.map((social, index) => (
                <Link
                  key={index}
                  href={social.href}
                  target="_blank"
                  className="text-muted-foreground hover:text-foreground transition-colors duration-200"
                >
                  <social.icon className="h-5 w-5" />
                  <span className="sr-only">{social.icon.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;