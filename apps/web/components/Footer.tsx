"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Facebook, Instagram, Moon, Send, Sun, Twitter, BookOpen } from "lucide-react"
import { useTheme } from "next-themes"

export function Footer() {
  const { theme, setTheme } = useTheme()
  const [isDarkMode, setIsDarkMode] = React.useState(false)

  React.useEffect(() => {
    setIsDarkMode(theme === "dark")
  }, [theme])

  const handleThemeChange = (checked: boolean) => {
    setTheme(checked ? "dark" : "light")
    setIsDarkMode(checked)
  }

  return (
    <footer className="relative bg-background text-foreground transition-colors duration-300 pt-24 pb-12">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="grid gap-16 md:grid-cols-2 lg:grid-cols-4">
          {/* Newsletter Column */}
          <div className="relative flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center shadow-sm">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-serif text-2xl font-bold">Tales.ai</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed max-w-xs">
              AI-crafted bedtime stories starring your child. Join our newsletter for magical updates and exclusive offers.
            </p>
            <form className="relative max-w-xs" onSubmit={(e) => e.preventDefault()}>
              <Input
                type="email"
                placeholder="Enter your email"
                className="pr-12 bg-muted/50 border-transparent focus:border-primary focus:bg-background transition-all"
              />
              <Button
                type="submit"
                size="icon"
                className="absolute right-1 top-1 h-8 w-8 rounded-full bg-amber-500 hover:bg-amber-600 text-white transition-transform hover:scale-105"
              >
                <Send className="h-3 w-3" />
                <span className="sr-only">Subscribe</span>
              </Button>
            </form>
          </div>

          {/* Product Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Product</h3>
            <nav className="flex flex-col gap-3 text-sm">
              <Link href="/stories" className="hover:text-amber-500 transition-colors w-fit">
                Library
              </Link>
              <Link href="/pricing" className="hover:text-amber-500 transition-colors w-fit">
                Pricing
              </Link>
              <Link href="/gift" className="hover:text-amber-500 transition-colors w-fit">
                Gift Cards
              </Link>
              <Link href="/create" className="hover:text-amber-500 transition-colors w-fit">
                Create Story
              </Link>
            </nav>
          </div>

          {/* Company Links */}
          <div className="flex flex-col gap-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Company</h3>
            <nav className="flex flex-col gap-3 text-sm">
              <Link href="/about" className="hover:text-amber-500 transition-colors w-fit">
                About Us
              </Link>
              <Link href="/privacy" className="hover:text-amber-500 transition-colors w-fit">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-amber-500 transition-colors w-fit">
                Terms of Service
              </Link>
              <a href="mailto:support@tales.ai" className="hover:text-amber-500 transition-colors w-fit">
                Contact Support
              </a>
            </nav>
          </div>

          {/* Social & Settings */}
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Follow Us</h3>
              <div className="flex gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-50 hover:text-amber-600">
                        <Twitter className="h-4 w-4" />
                        <span className="sr-only">Twitter</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Follow us on Twitter</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-50 hover:text-amber-600">
                        <Instagram className="h-4 w-4" />
                        <span className="sr-only">Instagram</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Follow us on Instagram</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full hover:bg-amber-50 hover:text-amber-600">
                        <Facebook className="h-4 w-4" />
                        <span className="sr-only">Facebook</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Follow us on Facebook</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Sun className="h-4 w-4 text-muted-foreground" />
              <Switch
                id="dark-mode"
                checked={isDarkMode}
                onCheckedChange={handleThemeChange}
                className="data-[state=checked]:bg-amber-500"
              />
              <Moon className="h-4 w-4 text-muted-foreground" />
              <Label htmlFor="dark-mode" className="sr-only">
                Toggle dark mode
              </Label>
            </div>
          </div>
        </div>

        <div className="mt-20 flex flex-col items-center justify-between gap-6 text-center md:flex-row text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} Tales.ai Inc. All rights reserved.
          </p>
          <nav className="flex gap-8">
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-foreground transition-colors">
              Terms
            </Link>
            <Link href="/cookies" className="hover:text-foreground transition-colors">
              Cookies
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}
