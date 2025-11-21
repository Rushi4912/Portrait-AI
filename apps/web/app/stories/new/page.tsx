"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import { BACKEND_URL } from "../../config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Wand2, User, Palette, Rocket } from "lucide-react";
import { motion } from "framer-motion";

interface Model {
  id: string;
  name: string;
  thumbnail?: string;
}

const ART_STYLES = [
  {
    id: "storybook illustration, watercolor style, soft colors, whimsical",
    name: "Watercolor Whimsy",
    emoji: "🎨",
    bg: "bg-blue-50"
  },
  {
    id: "pixar style 3d render, cute, vibrant colors, masterpiece",
    name: "3D Cartoon",
    emoji: "🎬",
    bg: "bg-purple-50"
  },
  {
    id: "classic storybook illustration, vintage style, detailed, ink and wash",
    name: "Classic Tale",
    emoji: "📜",
    bg: "bg-amber-50"
  },
  {
    id: "claymation style, stop motion, cute, plasticine texture",
    name: "Claymation",
    emoji: "🧶",
    bg: "bg-green-50"
  }
];

const STORY_CATEGORIES = [
  { id: "space", title: "Space Explorer", description: "Planets, rockets, friendly aliens.", preset: "Travels through space and befriends a tiny alien." },
  { id: "fairy", title: "Fairy Kingdom", description: "Castles, dragons, and magic.", preset: "Must save the fairy kingdom from a sleeping spell." },
  { id: "school", title: "School Day", description: "Friendships and lessons.", preset: "Learns the value of kindness at school." },
];

const BASE_MODELS = [
  { id: "flux", label: "Flux Pro", description: "Best for realism" },
  { id: "pixart", label: "PixArt", description: "Cartoon friendly" },
];

const STORY_TONES = ["Brave", "Funny", "Heartfelt", "Mysterious"];

export default function NewStoryWizard() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form Data
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [theme, setTheme] = useState("");
  const [artStyle, setArtStyle] = useState(ART_STYLES[0].id);
  const [category, setCategory] = useState(STORY_CATEGORIES[0]);
  const [baseModel, setBaseModel] = useState(BASE_MODELS[0]);
  const [tone, setTone] = useState(STORY_TONES[0]);

  useEffect(() => {
    // Fetch models
    const fetchModels = async () => {
      const token = await getToken();
      const res = await axios.get(`${BACKEND_URL}/models`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setModels(res.data.models);
    };
    fetchModels();
  }, [getToken]);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const combinedTheme = `${category.title} adventure: ${theme || category.preset}. Tone: ${tone}.`;
      const styleWithModel = `${artStyle}, rendered with ${baseModel.label} aesthetic`;
      const res = await axios.post(
        `${BACKEND_URL}/story/generate`,
        {
          modelId: selectedModelId,
          theme: combinedTheme,
          artStyle: styleWithModel
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Redirect to the story page (it will show "Generating" state)
      router.push(`/stories/${res.data.storyId}`);
    } catch (error) {
      console.error("Generation failed", error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8 flex justify-center gap-2">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-2 w-16 rounded-full transition-colors ${
                step >= s ? "bg-amber-500" : "bg-stone-200"
              }`}
            />
          ))}
        </div>

        <Card className="p-8 shadow-xl border-stone-200">
          
          {/* Step 1: Hero */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-8 h-8 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800">Who is the Hero?</h2>
                <p className="text-stone-500">Select the star of your story.</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {models.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => setSelectedModelId(model.id)}
                    className={`cursor-pointer relative rounded-xl overflow-hidden border-2 transition-all ${
                      selectedModelId === model.id 
                        ? "border-amber-500 ring-2 ring-amber-200 scale-105" 
                        : "border-transparent hover:border-stone-300"
                    }`}
                  >
                    <div className="aspect-square bg-stone-200">
                      {model.thumbnail ? (
                        <img src={model.thumbnail} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-amber-100 text-amber-800 font-bold text-xl">
                          {model.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-white font-medium text-center border-t">
                      {model.name}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={() => setStep(2)} 
                  disabled={!selectedModelId}
                  className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                  Next Step
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Adventure */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Rocket className="w-8 h-8 text-purple-600" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800">What's the Adventure?</h2>
                <p className="text-stone-500">Describe where they go or what happens.</p>
              </div>

              <div className="space-y-4 mb-8">
                <Label>Choose a Category</Label>
                <div className="grid grid-cols-3 gap-3">
                  {STORY_CATEGORIES.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat);
                        if (!theme) setTheme(cat.preset);
                      }}
                      className={`rounded-2xl border p-3 text-left transition-all ${category.id === cat.id ? "border-amber-500 bg-amber-50" : "border-stone-200 hover:border-stone-300"}`}
                    >
                      <p className="font-medium text-stone-900">{cat.title}</p>
                      <p className="text-xs text-stone-500">{cat.description}</p>
                    </button>
                  ))}
                </div>

                <Label className="block mt-6">Custom Prompt</Label>
                <Input
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g. Goes to the moon and meets a cheese alien..."
                  className="text-lg p-6"
                />
                <div className="flex gap-2 flex-wrap mt-4">
                    {["Finds a magic sword", "Becomes a superhero", "Opens a bakery"].map(t => (
                        <button 
                            key={t}
                            onClick={() => setTheme(t)}
                            className="px-3 py-1 rounded-full bg-stone-100 text-stone-600 text-sm hover:bg-stone-200"
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2">
                    <Label>Base AI Model</Label>
                    <div className="border rounded-2xl p-4">
                      {BASE_MODELS.map((model) => (
                        <label key={model.id} className="flex items-center gap-2 text-sm text-stone-600">
                          <input
                            type="radio"
                            className="accent-stone-900"
                            checked={baseModel.id === model.id}
                            onChange={() => setBaseModel(model)}
                          />
                          <span className="font-medium">{model.label}</span>
                          <span className="text-stone-400">{model.description}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Story Tone</Label>
                    <div className="flex flex-wrap gap-2">
                      {STORY_TONES.map((t) => (
                        <button
                          type="button"
                          key={t}
                          onClick={() => setTone(t)}
                          className={`px-3 py-1 rounded-full border text-sm ${tone === t ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-500"}`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
                <Button 
                    onClick={() => setStep(3)} 
                    disabled={!theme}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                >
                    Next Step
                </Button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Style */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
               <div className="text-center mb-8">
                 <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Palette className="w-8 h-8 text-pink-600" />
                </div>
                <h2 className="text-2xl font-bold text-stone-800">Pick an Art Style</h2>
                <p className="text-stone-500">How should the book look?</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                {ART_STYLES.map((style) => (
                  <div
                    key={style.id}
                    onClick={() => setArtStyle(style.id)}
                    className={`cursor-pointer p-4 rounded-xl border-2 transition-all ${style.bg} ${
                      artStyle === style.id
                        ? "border-amber-500 ring-2 ring-amber-200 scale-105"
                        : "border-transparent hover:border-stone-300"
                    }`}
                  >
                    <div className="text-3xl mb-2">{style.emoji}</div>
                    <div className="font-bold text-stone-800">{style.name}</div>
                  </div>
                ))}
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
                <Button 
                    onClick={handleGenerate} 
                    disabled={loading}
                    className="bg-amber-600 hover:bg-amber-700 text-white w-40"
                >
                    {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Create Magic
                        </>
                    )}
                </Button>
              </div>
            </motion.div>
          )}
        </Card>
      </div>
    </div>
  );
}

