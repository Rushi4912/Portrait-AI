"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Sparkles, Loader2 } from "lucide-react";

import { BACKEND_URL } from "../../config";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_FORM = {
  childName: "",
  childAge: 5,
  theme: "",
  artStyle: "storybook illustration",
  storyLength: "short",
  dedication: "",
};

const LENGTH_OPTIONS = [
  { value: "short", label: "Picture book • 5 pages" },
  { value: "medium", label: "Bedtime story • 8 pages" },
  { value: "long", label: "Chapter mini-book • 12 pages" },
];

export default function StorybookCreatePage() {
  const router = useRouter();
  const { getToken, user } = useAuth();

  const [form, setForm] = useState(DEFAULT_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      router.push("/sign-in");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      const token = await getToken?.();
      await axios.post(
        `${BACKEND_URL}/storybook/generate`,
        {
          ...form,
          childAge: Number(form.childAge),
        },
        token
          ? { headers: { Authorization: `Bearer ${token}` } }
          : undefined
      );

      setSuccessMessage("Story generation started! You’ll see it in the dashboard shortly.");
      setForm(DEFAULT_FORM);
      router.push("/storybook/dashboard");
    } catch (err) {
      console.error("Failed to start story generation", err);
      setError("We couldn't start your story. Please double-check the form and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Create</p>
        <h1 className="font-serif text-4xl font-bold text-stone-900">Personalize your child’s next adventure</h1>
        <p className="mt-2 max-w-2xl text-stone-500">
          Tell us a little bit about your child and we’ll handle the rest: script, illustrations, narration, and layout.
        </p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm space-y-6"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-stone-700">Child’s name</span>
            <input
              value={form.childName}
              onChange={(event) => setForm((prev) => ({ ...prev, childName: event.target.value }))}
              placeholder="Emma"
              className="rounded-2xl border border-stone-200 px-4 py-3 text-stone-900 focus:border-amber-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-stone-700">Age</span>
            <input
              type="number"
              min={3}
              max={12}
              value={form.childAge}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  childAge: Number(event.target.value),
                }))
              }
              className="rounded-2xl border border-stone-200 px-4 py-3 text-stone-900 focus:border-amber-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2 md:col-span-2">
            <span className="text-sm font-semibold text-stone-700">Theme or prompt</span>
            <input
              value={form.theme}
              onChange={(event) => setForm((prev) => ({ ...prev, theme: event.target.value }))}
              placeholder="Pirate treasure hunt in space"
              className="rounded-2xl border border-stone-200 px-4 py-3 text-stone-900 focus:border-amber-400 focus:outline-none"
              required
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-stone-700">Art style</span>
            <input
              value={form.artStyle}
              onChange={(event) => setForm((prev) => ({ ...prev, artStyle: event.target.value }))}
              placeholder="Watercolor storybook"
              className="rounded-2xl border border-stone-200 px-4 py-3 text-stone-900 focus:border-amber-400 focus:outline-none"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-stone-700">Story length</span>
            <select
              value={form.storyLength}
              onChange={(event) => setForm((prev) => ({ ...prev, storyLength: event.target.value }))}
              className="rounded-2xl border border-stone-200 px-4 py-3 text-stone-900 focus:border-amber-400 focus:outline-none"
            >
              {LENGTH_OPTIONS.map((option) => (
                <option value={option.value} key={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-stone-700">Dedication (optional)</span>
          <textarea
            value={form.dedication}
            onChange={(event) => setForm((prev) => ({ ...prev, dedication: event.target.value }))}
            placeholder="To the bravest explorer we know—Mom & Dad"
            rows={4}
            className="rounded-3xl border border-stone-200 px-4 py-3 text-stone-900 focus:border-amber-400 focus:outline-none"
          />
        </label>

        {error && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
        {successMessage && (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-600">{successMessage}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-6 py-3 font-semibold text-stone-900 shadow-lg shadow-amber-500/30 transition-all hover:bg-amber-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Summoning illustrations…" : "Generate story"}
        </button>
      </form>
    </div>
  );
}

