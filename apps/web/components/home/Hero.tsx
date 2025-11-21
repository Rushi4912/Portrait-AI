"use client";

import { HeroHeader } from "./HeroHeader";
import { Features } from "./Features";
import { TrustedBy } from "./TrustedBy";
import { HowItWorks } from "./HowItWorks";
import { Footer } from "../Footer";
import { StoryShowcase } from "./StoryShowcase";
import { BentoGrid } from "./BentoGrid";
import { Comparison } from "./Comparison";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function Hero() {
  return (
    <div className="bg-[#faf9f6] text-stone-900 min-h-screen overflow-hidden font-sans selection:bg-amber-100 selection:text-amber-900">
      
      {/* Premium Gradient Mesh Background */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[20%] w-[800px] h-[800px] rounded-full bg-amber-200/20 blur-[120px] animate-blob" />
        <div className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-orange-100/40 blur-[100px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-purple-100/30 blur-[120px] animate-blob animation-delay-4000" />
      </div>

      {/* Noise Texture Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        
        <HeroHeader />

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="mt-32 space-y-40"
        >
            <StoryShowcase />
            
            <BentoGrid />
            
            <HowItWorks />
            
            <Comparison />

            <TrustedBy />

            <section className="relative py-12">
                 <div className="text-center max-w-2xl mx-auto mb-16">
                    <motion.h2 
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-5xl font-serif font-bold text-stone-800 mb-4"
                    >
                        More Than Just Images
                    </motion.h2>
                    <p className="text-xl text-stone-600 font-light">
                        We build entire worlds around your child's imagination.
                    </p>
                </div>
                <Features />
            </section>

            <section className="py-20 text-center relative overflow-hidden rounded-[2.5rem] bg-stone-900 text-amber-50 mx-2 shadow-xl shadow-stone-900/20 group">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-stone-800 via-stone-900 to-black opacity-90" />
                <div className="absolute -top-1/2 right-0 w-[60%] h-full bg-amber-500/20 blur-[120px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

                <div className="relative z-10 max-w-3xl mx-auto px-6 space-y-6">
                    <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm uppercase tracking-wider text-amber-200">
                        <Sparkles className="w-4 h-4" />
                        Limited Founder Plan
                    </div>
                    <h2 className="text-4xl md:text-5xl font-serif font-bold text-amber-50 leading-tight">
                        Create a bedtime story in under 2 minutes.
                    </h2>
                    <p className="text-lg text-stone-300 leading-relaxed">
                        Upload photos once, generate infinite adventures forever. No design skills needed, just imagination.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <a href="/dashboard" className="inline-flex h-14 items-center justify-center rounded-full bg-amber-500 px-10 text-lg font-semibold text-stone-900 shadow-lg shadow-amber-500/40 hover:bg-amber-400 transition-all">
                            Start Free Trial
                        </a>
                        <a href="/storybook" className="inline-flex h-14 items-center justify-center rounded-full border border-white/30 px-10 text-lg font-semibold text-white hover:bg-white/10 transition-all">
                            Explore Storybook Studio
                        </a>
                    </div>
                </div>
            </section>
        </motion.div>

        <div className="mt-32 border-t border-stone-200/50 pt-12">
            <Footer />
        </div>
      </div>
    </div>
  );
}
