import Link from "next/link";
import { BookMarked } from "lucide-react";

import { BACKEND_URL } from "../../config";

interface StoryTemplate {
  id: string;
  name: string;
  ageRange: string;
  category: string;
  description?: string;
}

async function fetchTemplates(): Promise<StoryTemplate[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/storybook/templates`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error("Failed to fetch templates");
    }
    const data = await res.json();
    return data.templates ?? [];
  } catch (error) {
    console.error("Unable to fetch templates", error);
    return [];
  }
}

export default async function StorybookTemplatesPage() {
  const templates = await fetchTemplates();

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm uppercase tracking-[0.3em] text-stone-400">Templates</p>
        <h1 className="font-serif text-4xl font-bold text-stone-900">Pick a story starter</h1>
        <p className="mt-2 max-w-2xl text-stone-500">
          Curated creative briefs tuned for different ages and reading levels. Make one your own in seconds.
        </p>
      </header>

      {templates.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-stone-200 bg-white p-10 text-center text-stone-500">
          Templates have not been added yet. You can still{" "}
          <Link href="/storybook/create" className="text-amber-600 underline underline-offset-4">
            start a story from scratch
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {templates.map((template) => (
            <div key={template.id} className="flex flex-col rounded-3xl border border-stone-100 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-amber-400">{template.category}</p>
                  <h3 className="mt-2 text-2xl font-semibold text-stone-900">{template.name}</h3>
                </div>
                <BookMarked className="h-6 w-6 text-amber-500" />
              </div>

              <p className="mt-4 text-sm text-stone-500">{template.description ?? "Bring this template to life with your child’s photos."}</p>
              <p className="mt-3 rounded-full bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
                Ages {template.ageRange}
              </p>

              <Link
                href={{
                  pathname: "/storybook/create",
                  query: { templateId: template.id },
                }}
                className="mt-6 inline-flex items-center justify-center rounded-full border border-stone-200 px-5 py-2 text-sm font-semibold text-stone-800 hover:border-amber-300 hover:text-amber-600"
              >
                Use template
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

