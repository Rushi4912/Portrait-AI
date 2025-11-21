"use client";

import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "../../app/config";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, BookOpen, Sparkles, Filter, Search, Download, Star } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";

interface Story {
  id: string;
  title: string;
  status: "Pending" | "Generating" | "Completed" | "Failed";
  createdAt: string;
  model: {
    name: string;
    thumbnail?: string;
  };
  pages: {
    imageUrl?: string;
  }[];
}

export default function StoriesLibrary() {
  const { getToken } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Story["status"] | "All">("All");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [showFavorites, setShowFavorites] = useState(false);

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${BACKEND_URL}/story/mine`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStories(res.data.stories);
      } catch (error) {
        console.error("Failed to fetch stories", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
    const saved = typeof window !== "undefined" ? localStorage.getItem("favoriteStories") : null;
    if (saved) setFavorites(JSON.parse(saved));
  }, [getToken]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("favoriteStories", JSON.stringify(favorites));
    }
  }, [favorites]);

  const toggleFavorite = (id: string) => {
    setFavorites((prev) => (prev.includes(id) ? prev.filter((fav) => fav !== id) : [...prev, id]));
  };

  const filteredStories = useMemo(() => {
    return stories.filter((story) => {
      const matchesSearch = story.title.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || story.status === statusFilter;
      const matchesFavorite = !showFavorites || favorites.includes(story.id);
      return matchesSearch && matchesStatus && matchesFavorite;
    });
  }, [stories, search, statusFilter, showFavorites, favorites]);

  return (
    <div className="min-h-screen bg-[#faf9f6] pt-28 pb-20 px-4">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-serif font-bold text-stone-900 mb-2">Story Library</h1>
            <p className="text-stone-500">Browse, edit, and export every bedtime adventure you&apos;ve created.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/stories/new">
              <Button size="lg" className="bg-stone-900 text-white gap-2 rounded-full">
                <Sparkles className="w-5 h-5" /> Write New Story
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button size="lg" variant="outline" className="rounded-full">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </header>

        <div className="bg-white border border-stone-100 rounded-3xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3 text-stone-500 text-sm">
            <Filter className="w-4 h-4" />
            Filter Stories
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-1 justify-end">
            <div className="flex items-center gap-2 text-sm">
              {["All", "Completed", "Generating", "Failed"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status as any)}
                  className={`px-3 py-1.5 rounded-full border text-xs ${
                    statusFilter === status
                      ? "bg-stone-900 text-white border-stone-900"
                      : "border-stone-200 text-stone-500 hover:border-stone-400"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={showFavorites ? "default" : "outline"}
                size="sm"
                className="rounded-full"
                onClick={() => setShowFavorites((prev) => !prev)}
              >
                <Star className={`w-4 h-4 mr-1 ${showFavorites ? "fill-white" : ""}`} /> Favorites
              </Button>
            </div>
            <div className="relative">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title..."
                className="pl-10"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-96 bg-white rounded-3xl border border-stone-100 animate-pulse" />
            ))}
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="bg-white border border-stone-100 rounded-3xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-stone-200 mx-auto mb-4" />
            <h3 className="text-2xl font-serif text-stone-900 mb-2">No stories yet</h3>
            <p className="text-stone-500 mb-6">Create your first AI story to fill your library.</p>
            <Link href="/stories/new">
              <Button className="rounded-full bg-stone-900 text-white">Start Writing</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story, index) => (
              <Card key={story.id} className="overflow-hidden border border-stone-100 shadow-sm hover:shadow-lg transition-all">
                <div className="aspect-[3/4] bg-stone-100 relative">
                  {story.pages[0]?.imageUrl ? (
                    <img src={story.pages[0].imageUrl} alt={story.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">✨</div>
                  )}
                  <div className="absolute top-4 left-4 bg-white/80 text-xs px-3 py-1 rounded-full font-medium">
                    {story.status}
                  </div>
                  <button
                    onClick={() => toggleFavorite(story.id)}
                    className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center ${
                      favorites.includes(story.id) ? "bg-yellow-400 text-white" : "bg-white/80 text-stone-500"
                    }`}
                  >
                    <Star className={`w-4 h-4 ${favorites.includes(story.id) ? "fill-white" : ""}`} />
                  </button>
                </div>
                <div className="p-5 space-y-3">
                  <h3 className="font-serif text-xl text-stone-900">{story.title}</h3>
                  <p className="text-sm text-stone-500">Starring {story.model.name}</p>
                  <div className="flex gap-2">
                    <Link href={`/stories/${story.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">Read</Button>
                    </Link>
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      <Download className="w-4 h-4 mr-1" /> PDF
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

