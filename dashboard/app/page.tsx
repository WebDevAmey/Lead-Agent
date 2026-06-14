"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { LogoIcon } from "@/components/icons";
import { Footer } from "@/components/ui/footer";

const navigation = [
  { name: "Dashboard", href: "/dashboard" },
  { name: "How it works", href: "#how-it-works" },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <div className="relative isolate overflow-hidden bg-background">
        <div
          aria-hidden="true"
          className="absolute top-0 right-0 -z-10 h-[40rem] w-[40rem] translate-x-1/3 -translate-y-1/3 rounded-full bg-primary/10 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute bottom-0 left-0 -z-10 h-[30rem] w-[30rem] -translate-x-1/3 translate-y-1/3 rounded-full bg-primary/5 blur-3xl"
        />

        <header className="relative z-10">
          <nav className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8">
            <Link href="/" className="flex items-center gap-2">
              <LogoIcon className="h-7 w-7 text-primary" />
              <span className="text-lg font-bold text-foreground">LeadFinder</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-foreground lg:hidden"
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden lg:flex lg:gap-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  {item.name}
                </Link>
              ))}
            </div>

            <div className="hidden lg:flex">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground hover:text-primary"
              >
                Open Dashboard <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </nav>

          {mobileMenuOpen && (
            <div className="fixed inset-0 z-50 bg-background lg:hidden">
              <div className="flex items-center justify-between p-6">
                <Link href="/" className="flex items-center gap-2">
                  <LogoIcon className="h-7 w-7 text-primary" />
                  <span className="text-lg font-bold text-foreground">LeadFinder</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="-m-2.5 rounded-md p-2.5 text-foreground"
                >
                  <span className="sr-only">Close menu</span>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-col gap-2 px-6 py-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-lg px-3 py-2 text-base font-semibold text-foreground hover:bg-muted"
                  >
                    {item.name}
                  </Link>
                ))}
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="rounded-lg px-3 py-2 text-base font-semibold text-primary hover:bg-muted"
                >
                  Open Dashboard
                </Link>
              </div>
            </div>
          )}
        </header>

        <main className="relative z-10 mx-auto max-w-4xl px-6 py-32 text-center sm:py-40 lg:px-8">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-muted/60 px-4 py-1.5 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-primary" />
            Lead Intelligence for Shopify
          </div>

          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-7xl">
            Find{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Solo Founders
            </span>
          </h1>

          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Discover and score independent Shopify store owners with an
            automated lead-finding agent. Crawl stores, extract contact info,
            and rank prospects by how likely they are run by a single founder —
            all from one dashboard.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Open Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="text-sm font-semibold text-foreground hover:text-primary"
            >
              How it works
            </a>
          </div>
        </main>
      </div>

      <Footer />
    </>
  );
}
