"use client";

import * as React from "react";
import Link from "next/link";
import { Equal, X, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/liquid-glass-button";
import { cn } from "@/lib/utils";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Credits } from "./navbar/Credits";

const NAV_ITEMS = [
  { label: "Storybook", href: "/storybook" },
  { label: "Dashboard", href: "/dashboard" },
  { label: "Library", href: "/stories" },
  { label: "Pricing", href: "/pricing" },
  { label: "Gift Cards", href: "/gift" },
];

export function Appbar() {
  const [menuState, setMenuState] = React.useState(false);
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="w-full flex justify-center">
      <nav
        data-state={menuState && "active"}
        className="fixed top-4 z-50 w-full px-2 flex justify-center"
      >
        <div
          className={cn(
            "w-[95%] max-w-6xl transition-all duration-300 rounded-2xl border px-6 lg:px-12",
            isScrolled
              ? "bg-white/80 backdrop-blur-xl border-white/20 shadow-lg shadow-black/5 py-2"
              : "bg-transparent border-transparent py-4"
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 lg:gap-0">
            {/* Logo */}
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:rotate-6 transition-transform duration-300">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-serif font-bold text-2xl text-stone-900 tracking-tight group-hover:text-amber-700 transition-colors">
                  Tales<span className="text-amber-600">.ai</span>
                </span>
              </Link>

              {/* Mobile Toggle */}
              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Equal className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            {/* Desktop Nav */}
            <div className="hidden lg:block">
              <ul className="flex gap-8 text-sm font-medium">
                {NAV_ITEMS.map((item, index) => (
                  <li key={index}>
                    <Link
                      href={item.href}
                      className="text-stone-600 hover:text-amber-600 block duration-150"
                    >
                      <span>{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Actions & Mobile Menu Content */}
            <div className="bg-white lg:bg-transparent in-data-[state=active]:block lg:in-data-[state=active]:flex mb-6 hidden w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border border-stone-100 p-6 shadow-2xl shadow-stone-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:p-0 lg:shadow-none">
              
              {/* Mobile Nav Items */}
              <div className="lg:hidden">
                <ul className="space-y-6 text-base font-medium">
                  {NAV_ITEMS.map((item, index) => (
                    <li key={index}>
                      <Link
                        href={item.href}
                        className="text-stone-600 hover:text-amber-600 block duration-150"
                        onClick={() => setMenuState(false)}
                      >
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Auth Buttons */}
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit items-center">
                <SignedIn>
                  <Credits />
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox: "h-9 w-9 rounded-full ring-2 ring-white shadow-sm",
                      },
                    }}
                  />
                </SignedIn>

                <SignedOut>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className={cn("text-stone-600 hover:text-amber-600 hover:bg-amber-50", isScrolled && "lg:hidden")}
                  >
                    <SignInButton mode="modal">
                      <span>Log in</span>
                    </SignInButton>
                  </Button>
                  
                  <Button
                    asChild
                    size="sm"
                    className="bg-stone-900 text-white hover:bg-stone-800 shadow-lg shadow-stone-900/20"
                  >
                    <SignInButton mode="modal">
                      <span className="flex items-center gap-2">
                        Start Creating
                        <Sparkles className="w-3 h-3 text-amber-300" />
                      </span>
                    </SignInButton>
                  </Button>
                </SignedOut>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
