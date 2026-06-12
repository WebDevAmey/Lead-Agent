"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { DotGlobeHero } from "@/components/ui/globe-hero";
import { Footer } from "@/components/ui/footer";

export default function Home() {
  return (
    <>
      <DotGlobeHero
        rotationSpeed={0.004}
        className="bg-gradient-to-br from-background via-background/95 to-muted/10"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-background/30" />
        <div className="absolute top-1/4 left-1/4 h-96 w-96 animate-pulse rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 animate-pulse rounded-full bg-primary/3 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-5xl space-y-12 px-6 py-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative inline-flex items-center gap-3 rounded-full border border-primary/30 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 px-6 py-3 shadow-2xl backdrop-blur-xl"
            >
              <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-primary/10 via-transparent to-primary/10" />
              <div className="h-2 w-2 animate-ping rounded-full bg-primary" />
              <span className="relative z-10 text-sm font-bold tracking-wider text-primary uppercase">
                Lead Intelligence
              </span>
              <div className="h-2 w-2 animate-ping rounded-full bg-primary [animation-delay:500ms]" />
            </motion.div>

            <div className="space-y-6">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.3 }}
                className="text-5xl font-black tracking-tighter leading-[0.85] select-none md:text-7xl lg:text-8xl xl:text-9xl"
              >
                <span className="mb-3 block text-4xl font-light text-foreground/70 md:text-6xl lg:text-7xl">
                  Find
                </span>
                <span className="relative block">
                  <span className="relative z-10 bg-gradient-to-br from-primary via-primary to-primary/60 bg-clip-text font-black text-transparent">
                    Solo Founders
                  </span>
                  <div className="absolute inset-0 scale-105 bg-gradient-to-br from-primary via-primary to-primary/60 bg-clip-text font-black text-transparent opacity-50 blur-2xl">
                    Solo Founders
                  </div>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 1.5, delay: 1.2, ease: "easeOut" }}
                    className="absolute -bottom-6 left-0 h-3 rounded-full bg-gradient-to-r from-primary via-primary/80 to-transparent shadow-lg shadow-primary/50"
                  />
                </span>
              </motion.h1>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="mx-auto max-w-3xl space-y-4"
            >
              <p className="text-xl leading-relaxed font-medium text-muted-foreground md:text-2xl">
                Discover and score independent Shopify store owners with our{" "}
                <span className="rounded-md bg-gradient-to-r from-primary/20 to-primary/10 px-2 py-1 font-semibold text-foreground">
                  automated lead-finding agent
                </span>
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground/80">
                Crawl stores, extract contact info, and rank prospects by how
                likely they are run by a single founder — all from one
                dashboard.
              </p>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1 }}
            className="flex flex-col items-center justify-center gap-6 pt-4 sm:flex-row"
          >
            <Link href="/dashboard">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow:
                    "0 20px 40px rgba(0,0,0,0.2), 0 0 25px rgba(45, 212, 191, 0.3)",
                  y: -2,
                }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary via-primary to-primary/90 px-8 py-4 text-lg font-semibold text-primary-foreground shadow-xl transition-all duration-500 hover:shadow-primary/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.8 }}
                />
                <span className="relative z-10 tracking-wide">Open Dashboard</span>
                <ArrowRight className="relative z-10 h-5 w-5 transition-transform duration-300 group-hover:translate-x-2" />
              </motion.button>
            </Link>

            <a href="#how-it-works">
              <motion.button
                whileHover={{
                  scale: 1.05,
                  boxShadow:
                    "0 15px 30px rgba(0,0,0,0.1), 0 0 15px rgba(45, 212, 191, 0.1)",
                  y: -2,
                }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center gap-3 overflow-hidden rounded-xl border-2 border-border/40 bg-background/60 px-8 py-4 text-lg font-semibold shadow-lg backdrop-blur-xl transition-all duration-500 hover:border-primary/40 hover:bg-background/90"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                <Zap className="relative z-10 h-5 w-5 transition-all duration-300 group-hover:scale-110 group-hover:rotate-6" />
                <span className="relative z-10 tracking-wide">How It Works</span>
              </motion.button>
            </a>
          </motion.div>
        </div>
      </DotGlobeHero>

      <Footer />
    </>
  );
}
