import Link from "next/link";
import { Sparkles, BookOpenText, Wand2 } from "lucide-react";

export default function StorybookHome() {
  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-8 shadow-sm">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-amber-500">
              New • Storybook Studio
            </p>
            <h1 className="font-serif text-4xl font-bold text-stone-900 mt-3">
              Turn family photos into bedtime adventures.
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-stone-600">
              Upload your child&apos;s photos once and generate illustrated chapters,
              printable PDFs, and narrated audio with a single tap.
            </p>
          </div>
          <div className="flex flex-col gap-3 min-w-[220px]">
            <Link
              href="/storybook/create"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-white font-medium shadow-lg hover:bg-stone-800"
            >
              <Sparkles className="h-4 w-4" />
              Create a Story
            </Link>
            <Link
              href="/storybook/templates"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-stone-200 px-6 py-3 text-stone-800 font-medium hover:border-amber-300 hover:text-amber-600"
            >
              <BookOpenText className="h-4 w-4" />
              Browse Templates
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {[
          {
            title: "Personalize",
            description: "Drop in your child's name, age, interests, and art style.",
          },
          {
            title: "Illustrate",
            description: "Our AI writes the script and paints each page in your style.",
          },
          {
            title: "Share & print",
            description: "Download PDFs, audio narration, or order a hardcover copy.",
          },
        ].map((step) => (
          <div
            key={step.title}
            className="rounded-3xl border border-stone-100 bg-white p-6 shadow-sm"
          >
            <Wand2 className="h-6 w-6 text-amber-500" />
            <h3 className="mt-4 text-xl font-semibold text-stone-900">{step.title}</h3>
            <p className="mt-2 text-sm text-stone-500">{step.description}</p>
          </div>
        ))}
      </section>
    </div>
  );
}

