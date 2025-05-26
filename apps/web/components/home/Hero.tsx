"use client";

import { BackgroundEffects } from "./BackgroundEffects";
import { HeroHeader } from "./HeroHeader";
import { Features } from "./Features";
import { Testimonials } from "./Testimonials";
import { SignInButton, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Clock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { ScrollIndicator } from "./ScrollIndicator";
import { StatsSection } from "./StatsSection";
import { PricingSection } from "./PricingSection";
import { HowItWorks } from "./HowItWorks";

export function Hero() {
  return (
    <div className="dark:bg-black">
      <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900 via-gray-900 to-black text-white overflow-hidden">
        <BackgroundEffects />

        <div className="relative max-w-7xl mx-auto px-6 sm:px-10 lg:px-12 pt-32 pb-24">
          <HeroHeader />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="mt-24"
          >
            {/* Section: How It Works */}
            <section className="relative py-24">
              <HowItWorks />
            </section>

            {/* Section: Stats */}
            <section className="relative py-24">
              <StatsSection />
            </section>

            {/* Section: Features */}
            <section id="features" className="relative py-24">
              <Features />
            </section>

            {/* Section: Testimonials */}
            <section className="relative py-24">
              <Testimonials />
            </section>

            {/* Section: Pricing */}
            <section className="relative py-24">
              <PricingSection />
            </section>

            {/* Final CTA Section */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="relative py-24 md:py-32"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-red-500/20 blur-2xl" />
              <div className="relative text-center max-w-4xl mx-auto space-y-10">
                <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 dark:from-purple-400 dark:via-pink-500 dark:to-red-500 bg-clip-text text-transparent">
                  Start Your AI Portrait Journey Today
                </h2>
                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
                  Join thousands of creators who have already transformed their photos with our AI technology.
                </p>

                <SignedOut>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-6">
                    <Button
                      asChild
                      size="lg"
                      className="group bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg"
                    >
                      <SignInButton mode="modal">
                        <span className="flex items-center">
                          Get Started Free
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </SignInButton>
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="text-black dark:text-white px-8 py-4 text-lg"
                      onClick={() =>
                        document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })
                      }
                    >
                      Learn More
                    </Button>
                  </div>
                </SignedOut>

                <div className="pt-10 flex flex-wrap items-center justify-center gap-6 text-sm md:text-base">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-300">
                    <CheckCircle className="w-4 h-4" />
                    No credit card required
                  </div>
                  <span className="hidden sm:inline text-gray-500">•</span>
                  <div className="flex items-center gap-2 text-pink-600 dark:text-pink-300">
                    <Sparkles className="w-4 h-4" />
                    Free credits to start
                  </div>
                  <span className="hidden sm:inline text-gray-500">•</span>
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-300">
                    <Clock className="w-4 h-4" />
                    Cancel anytime
                  </div>
                </div>
              </div>
            </motion.section>
          </motion.div>
        </div>

        <ScrollIndicator />
      </div>
    </div>
  );
}