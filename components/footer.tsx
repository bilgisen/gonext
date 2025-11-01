import { Separator } from "@/components/ui/separator";
import {
  GithubIcon,
  GlobeIcon,
  LinkedinIcon,
  TwitterIcon,
  FacebookIcon,
  MailIcon,
  InstagramIcon,
  YoutubeIcon,
} from "lucide-react";
import Link from "next/link";
import { Logo } from "./navbar-02/logo";

const footerSections = [
  {
    title: "Turkey",
    href: "/turkey", // Adjusted for English
    links: [
      { title: "Politics", href: "/topic/politics" },
      { title: "Istanbul", href: "/tags/istanbul" },
      { title: "Ankara", href: "/tags/ankara" },
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
      { title: "Google", href: "/tags/google" },
      { title: "AI", href: "/topic/ai" },
      { title: "Apple", href: "/topic/apple" },
    ],
  },
  {
    title: "Sports",
    href: "/sports",
    links: [
      { title: "Fenerbahçe", href: "/tags/fenerbahce" },
      { title: "Beşiktaş", href: "/tags/besiktas" },
      { title: "Galatasaray", href: "/tags/galatasaray" },
    ],
  },
  {
    title: "Culture",
    href: "/culture",
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
    <div className="min-h-screen flex flex-col">
      <div className="grow bg-muted" />
      <footer className="border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="max-w-7xl mx-auto">
          <div className="py-12 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-x-8 gap-y-10 px-6 xl:px-0">
            {/* Logo and Description Column */}
            <div className="col-span-full xl:col-span-1">
              <Logo />
              <p className="mt-4 text-muted-foreground text-sm leading-relaxed">
                Stay updated with the latest news and insights.
              </p>
            </div>

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
                <ul className="mt-6 space-y-3">
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

            {/* Social and Contact Column */}
            <div className="col-span-full sm:col-span-2 md:col-span-3 lg:col-span-2 xl:col-span-1">
              <h6 className="font-semibold text-foreground tracking-tight">
                Contact Us
              </h6>
              <ul className="mt-6 space-y-3">
                <li>
                  <Link
                    href="mailto:info@example.com"
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm flex items-center gap-2"
                  >
                    <MailIcon className="w-4 h-4" />
                    Email
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://example.com"
                    target="_blank"
                    className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm flex items-center gap-2"
                  >
                    <GlobeIcon className="w-4 h-4" />
                    example.com
                  </Link>
                </li>
              </ul>
              <div className="mt-6 flex space-x-4">
                {socialLinks.map((social, index) => (
                  <div key={index}>
                    <Link
                      href={social.href}
                      target="_blank"
                      className="text-muted-foreground hover:text-foreground transition-colors duration-200 block"
                    >
                      <social.icon className="w-5 h-5" />
                      <span className="sr-only">{social.icon.name}</span>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Separator />
          <div className="py-8 flex flex-col-reverse sm:flex-row items-center justify-between gap-x-2 gap-y-5 px-6 xl:px-0">
            <span className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()}{" "}
              <Link href="/" className="hover:underline">
                News Portal
              </Link>
              . All rights reserved.
            </span>

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