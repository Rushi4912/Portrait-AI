"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useAuth } from "@clerk/nextjs";
import { motion } from "framer-motion";
import { Plus, Sparkles, BookOpen, User, ArrowRight, Clock } from "lucide-react";
import { BACKEND_URL } from "../config";
import { Button } from "@/components/ui/button";
import { CreditsBadge } from "@/components/dashboard/CreditsBadge";

interface Story {
  id: string;
  title: string;
  createdAt: string;
  status: "Pending" | "Generating" | "Completed" | "Failed";
  model: {
    name: string;
    thumbnail?: string;
  };
  pages: { imageUrl?: string }[];
}

const STORY_CATEGORIES = [
  {
    title: "Space Explorer",
    description: "Launch to distant galaxies.",
    icon: "🚀",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    title: "Fairy Kingdom",
    description: "Magic forests and castles.",
    icon: "🧚",
    gradient: "from-pink-400 to-rose-500",
  },
  {
    title: "Jungle Quest",
    description: "Animals, vines, big adventures.",
    icon: "🌿",
    gradient: "from-green-400 to-emerald-500",
  },
];

interface Character {
  id: string;
  name: string;
  thumbnail?: string;
}

export default function DashboardPage() {
  const { getToken, user } = useAuth();
  const [stories, setStories] = useState<Story[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const [storiesRes, modelsRes] = await Promise.all([
          axios.get(`${BACKEND_URL}/story/mine`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${BACKEND_URL}/models`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        setStories(storiesRes.data.stories);
        setCharacters(modelsRes.data.models);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) fetchData();
  }, [getToken, user]);

  return (
    <div className="min-h-screen bg-[#faf9f6] pt-28 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between"
        >
          <div>
            <h1 className="font-serif text-4xl text-stone-900 font-bold mb-2">
              Welcome back, {user?.firstName || "Storyteller"}
            </h1>
            <p className="text-stone-500">Ready to write another chapter?</p>
          </div>
          <div className="w-full lg:w-auto">
            <CreditsBadge />
          </div>
        </motion.header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column: Actions & Characters */}
          <div className="space-y-8">
            
            {/* Create New Story Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-8 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group cursor-pointer"
            >
              <Link href="/stories/new" className="absolute inset-0 z-20" />
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-3xl font-serif font-bold mb-2">Create New Story</h2>
                <p className="text-white/80 mb-8">Write a magical adventure in minutes.</p>
                
                <div className="flex items-center gap-2 font-medium bg-white/20 w-fit px-4 py-2 rounded-full backdrop-blur-md group-hover:bg-white group-hover:text-orange-600 transition-colors">
                  Start Magic <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
            >
              <Link href="/train" className="bg-white border border-stone-100 rounded-2xl p-4 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-700">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">Train Character</p>
                    <p className="text-xs text-stone-500">5-10 photos required</p>
                  </div>
                </div>
              </Link>
              <Link href="/stories" className="bg-white border border-stone-100 rounded-2xl p-4 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-700">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">View Library</p>
                    <p className="text-xs text-stone-500">Read or export</p>
                  </div>
                </div>
              </Link>
              <Link href="/storybook/create" className="bg-white border border-amber-100 rounded-2xl p-4 hover:shadow-md transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-stone-900">Storybook Studio</p>
                    <p className="text-xs text-stone-500">New personalized books</p>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Templates */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-xl font-bold text-stone-900">Story Templates</h3>
                <Link href="/stories/new" className="text-sm text-amber-600 hover:text-amber-700 font-medium">
                  Customize
                </Link>
              </div>
              <div className="space-y-3">
                {STORY_CATEGORIES.map((category) => (
                  <div
                    key={category.title}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-stone-100 hover:border-amber-200 transition-all"
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-r ${category.gradient} flex items-center justify-center text-white text-xl`}>
                      {category.icon}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-stone-900">{category.title}</p>
                      <p className="text-xs text-stone-500">{category.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* My Characters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-xl font-bold text-stone-900">My Characters</h3>
                <Link href="/train">
                  <Button variant="ghost" size="sm" className="text-stone-400 hover:text-stone-900">
                    <Plus className="w-4 h-4 mr-1" /> Add
                  </Button>
                </Link>
              </div>

              {characters.length === 0 ? (
                <div className="text-center py-8 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                  <User className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-500 text-sm">No characters yet</p>
                </div>
              ) : (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                  {characters.map((char) => (
                    <div key={char.id} className="flex flex-col items-center gap-2 min-w-[80px]">
                      <div className="w-16 h-16 rounded-full bg-stone-100 border-2 border-white shadow-md overflow-hidden relative">
                        {char.thumbnail ? (
                          <img src={char.thumbnail} alt={char.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold text-xl">
                            {char.name[0]}
                          </div>
                        )}
                      </div>
                      <span className="text-xs font-medium text-stone-600 truncate w-full text-center">{char.name}</span>
                    </div>
                  ))}
                  <Link href="/train" className="flex flex-col items-center gap-2 min-w-[80px] group">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-stone-300 flex items-center justify-center text-stone-400 group-hover:border-amber-500 group-hover:text-amber-500 transition-colors">
                      <Plus className="w-6 h-6" />
                    </div>
                    <span className="text-xs font-medium text-stone-400 group-hover:text-amber-500">New</span>
                  </Link>
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">

            {/* Pipeline */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white rounded-3xl p-6 border border-stone-100 shadow-sm"
            >
              <h3 className="font-serif text-xl font-bold text-stone-900 mb-4">Story Pipeline</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { title: "Train Character", status: characters.length ? "Done" : "Start", description: "Upload photos once." },
                  { title: "Write Story", status: stories.some(s => s.status === "Generating") ? "In progress" : "Ready", description: "Pick theme & tone." },
                  { title: "Read & Export", status: stories.length ? "Available" : "Pending", description: "PDF & share links." },
                ].map((step) => (
                  <div key={step.title} className="p-4 rounded-2xl border border-stone-100 bg-stone-50/50">
                    <p className="text-xs uppercase tracking-wide text-stone-400">{step.status}</p>
                    <p className="font-medium text-stone-900">{step.title}</p>
                    <p className="text-xs text-stone-500 mt-1">{step.description}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Story Library */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-serif text-2xl font-bold text-stone-900">Recent Adventures</h3>
                <Link href="/stories" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
                  View All
                </Link>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-64 bg-white rounded-3xl animate-pulse" />
                  ))}
                </div>
              ) : stories.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-stone-100 shadow-sm">
                  <BookOpen className="w-12 h-12 text-amber-200 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-stone-900 mb-2">Your library is empty</h4>
                  <p className="text-stone-500 mb-6">Create your first story to see it here.</p>
                  <Link href="/stories/new">
                    <Button className="bg-stone-900 text-white hover:bg-stone-800">Start Writing</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {stories.map((story) => (
                    <Link href={`/stories/${story.id}`} key={story.id}>
                      <div className="bg-white rounded-3xl p-4 border border-stone-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group h-full flex flex-col">
                        <div className="aspect-[16/10] bg-stone-100 rounded-2xl overflow-hidden relative mb-4">
                          {story.pages[0]?.imageUrl ? (
                            <img src={story.pages[0].imageUrl} alt={story.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-amber-50">
                              <Sparkles className="w-8 h-8 text-amber-300" />
                            </div>
                          )}
                          {story.status === "Generating" && (
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center">
                              <div className="bg-white/90 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
                                <Clock className="w-3 h-3 animate-spin" /> Writing...
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="px-2 pb-2 flex-1">
                          <h4 className="font-serif font-bold text-lg text-stone-900 leading-tight mb-1 group-hover:text-amber-600 transition-colors">
                            {story.title}
                          </h4>
                          <p className="text-sm text-stone-500">Starring {story.model.name}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}
