"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Link from "next/link";
import { BookOpen, Loader2, Download, Images, Volume2 } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { BACKEND_URL } from "../../config";

interface StorySummary {
  id: string;
  title: string;
  status: string;
  createdAt: string;
  childName?: string;
  pageCount?: number;
}

interface StorybookStats {
  totalStories: number;
  completedStories: number;
  pagesRendered: number;
  audioNarrations: number;
  stories: StorySummary[];
}

const EMPTY_STATS: StorybookStats = {
  totalStories: 0,
  completedStories: 0,
  pagesRendered: 0,
  audioNarrations: 0,
  stories: [],
};

export default function StorybookDashboardPage() {
  const { getToken, user } = useAuth();
  const [stats, setStats] = useState<StorybookStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken?.();
        const { data } = await axios.get(`${BACKEND_URL}/storybook/dashboard/stats`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        setStats(data);
      } catch (error) {
        console.error("Unable to load storybook stats", error);
        setStats(EMPTY_STATS);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [getToken, user]);

  const summaryCards = [
    { label: "Total stories", value: stats.totalStories, icon: BookOpen },
    { label: "Completed", value: stats.completedStories, icon: Images },
    { label: "Pages rendered", value: stats.pagesRendered, icon: Download },
    { label: "Audio narrations", value: stats.audioNarrations, icon: Volume2 },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Dashboard</p>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold text-stone-900">My Storybook Studio</h1>
            <p className="text-stone-500">Track drafts, continue writing, and export finished adventures.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/storybook/create"
              className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-stone-800"
            >
              New Story
            </Link>
            <Link
              href="/stories"
              className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-700 hover:border-amber-300 hover:text-amber-600"
            >
              View Library
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-3xl border border-stone-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stone-500">{card.label}</p>
              <card.icon className="h-4 w-4 text-amber-500" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-stone-900">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-stone-900">Recent stories</h2>
          <Link href="/stories" className="text-sm font-medium text-amber-600 hover:text-amber-700">
            Open library
          </Link>
        </div>

        {loading ? (
          <div className="flex items-center gap-3 py-12">
            <Loader2 className="h-5 w-5 animate-spin text-stone-400" />
            <p className="text-sm text-stone-500">Loading your adventures…</p>
          </div>
        ) : stats.stories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 py-12 text-center text-stone-500">
            No stories yet. Start your first one today!
          </div>
        ) : (
          <div className="mt-6 divide-y divide-stone-100">
            {stats.stories.map((story) => (
              <div key={story.id} className="flex flex-wrap items-center gap-4 py-4">
                <div className="flex-1">
                  <p className="text-lg font-semibold text-stone-900">{story.title}</p>
                  <p className="text-sm text-stone-500">
                    {story.childName ? `For ${story.childName}` : "Personalized"} · {story.pageCount || 0} pages
                  </p>
                </div>
                <span className="rounded-full border border-stone-200 px-3 py-1 text-xs uppercase tracking-wide text-stone-500">
                  {story.status}
                </span>
                <Link
                  href={`/stories/${story.id}`}
                  className="text-sm font-medium text-amber-600 hover:text-amber-700"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

