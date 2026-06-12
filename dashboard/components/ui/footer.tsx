import Link from "next/link";
import { LogoIcon, GithubIcon, LinkedinIcon } from "@/components/icons";
import { X } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-background px-4 py-12 md:px-6">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between md:flex-row">
          <div className="mb-8 md:mb-0">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon className="h-8 w-8 text-primary" />
              <h2 className="text-lg font-bold text-foreground">LeadFinder</h2>
            </Link>

            <p className="mt-4 max-w-xs text-sm text-muted-foreground">
              Shopify solo-founder intelligence — discover, score, and reach
              independent store owners across the web.
            </p>

            <p className="mt-5 text-sm text-muted-foreground">
              © {new Date().getFullYear()} LeadFinder. All rights reserved.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-2">
            <div>
              <h3 className="mb-4 font-semibold text-foreground">Pages</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 font-semibold text-foreground">Socials</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="https://github.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <GithubIcon className="h-4 w-4" />
                    Github
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://linkedin.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <LinkedinIcon className="h-4 w-4" />
                    LinkedIn
                  </Link>
                </li>
                <li>
                  <Link
                    href="https://x.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />X
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-4 flex w-full items-center justify-center">
          <h1 className="bg-gradient-to-b from-zinc-700 to-zinc-900 bg-clip-text text-center text-3xl font-bold text-transparent select-none md:text-5xl lg:text-[10rem]">
            LeadFinder
          </h1>
        </div>
      </div>
    </footer>
  );
}

export { Footer };
