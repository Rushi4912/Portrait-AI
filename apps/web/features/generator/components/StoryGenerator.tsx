"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  Sparkles,
  Camera,
  Palette,
  BookOpen,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  User,
  Wand2,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/hooks/useAuth";
import { BACKEND_URL } from "../../../app/config";
import { STORY_CATEGORIES, STORY_LENGTH_CONFIG } from "../../../services/fal/storyGeneration";
import { ART_STYLES } from "../../../services/fal/imageGeneration";
import { STORY_STARTERS } from "../../../utils/prompts/storyPrompts";

interface Model {
  id: string;
  name: string;
  thumbnail?: string;
  trainingStatus: string;
}

const STEPS = [
  { title: "Choose Hero", description: "Select the star of your story", icon: User },
  { title: "Story Theme", description: "Pick the adventure", icon: BookOpen },
  { title: "Art Style", description: "Choose the look", icon: Palette },
  { title: "Generate", description: "Create your story", icon: Sparkles },
];

export function StoryGenerator() {
  const router = useRouter();
  const { getToken, user } = useAuth();

  // State
  const [step, setStep] = useState(0);
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [selectedModelId, setSelectedModelId] = useState("");
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState(5);
  const [theme, setTheme] = useState("");
  const [category, setCategory] = useState("adventure");
  const [storyLength, setStoryLength] = useState<"short" | "medium" | "long">("short");
  const [artStyle, setArtStyle] = useState(ART_STYLES[0]?.id || "comic-disney");
  const [dedication, setDedication] = useState("");
  const [includeAudio, setIncludeAudio] = useState(false);
  const [voiceId, setVoiceId] = useState("sarah");

  // Fetch trained models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const token = await getToken?.();
        if (!token) return;

        const res = await axios.get(`${BACKEND_URL}/models`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const trainedModels = res.data.models.filter(
          (m: Model) => m.trainingStatus === "Generated"
        );
        setModels(trainedModels);

        // Auto-select first model
        if (trainedModels.length > 0) {
          setSelectedModelId(trainedModels[0].id);
          setChildName(trainedModels[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch models", err);
      } finally {
        setModelsLoading(false);
      }
    };

    fetchModels();
  }, [getToken]);

  const handleGenerate = async () => {
    if (!selectedModelId || !theme) {
      setError("Please complete all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = await getToken?.();
      const selectedArt = ART_STYLES.find((s) => s.id === artStyle);

      const res = await axios.post(
        `${BACKEND_URL}/story/generate`,
        {
          modelId: selectedModelId,
          theme,
          artStyle: selectedArt?.prompt || artStyle,
          childName,
          childAge,
          storyLength,
          category,
          dedication: dedication || undefined,
          includeAudio,
          voiceId: includeAudio ? voiceId : undefined,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Redirect to story viewer
      router.push(`/stories/${res.data.storyId}`);
    } catch (err: any) {
      console.error("Generation failed", err);
      setError(
        err.response?.data?.message || "Failed to start story generation"
      );
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return !!selectedModelId;
      case 1:
        return !!theme;
      case 2:
        return !!artStyle;
      case 3:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (canProceed()) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => setStep((s) => Math.max(s - 1, 0));

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="p-8 text-center max-w-md">
          <User className="w-16 h-16 mx-auto text-stone-300 mb-4" />
          <h2 className="text-2xl font-serif font-bold text-stone-900 mb-2">
            Sign in to Create Stories
          </h2>
          <p className="text-stone-500 mb-6">
            Join to create personalized storybooks with your child as the hero.
          </p>
          <Button
            onClick={() => router.push("/sign-in")}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex justify-between items-center relative">
          {/* Progress line */}
          <div className="absolute left-0 right-0 top-6 h-0.5 bg-stone-200" />
          <div
            className="absolute left-0 top-6 h-0.5 bg-amber-500 transition-all duration-500"
            style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }}
          />

          {STEPS.map((s, index) => {
            const Icon = s.icon;
            const isActive = index === step;
            const isComplete = index < step;

            return (
              <div
                key={s.title}
                className="relative z-10 flex flex-col items-center"
              >
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-amber-500 text-white scale-110 shadow-lg shadow-amber-200"
                      : isComplete
                      ? "bg-emerald-500 text-white"
                      : "bg-white border-2 border-stone-200 text-stone-400"
                  }`}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive ? "text-amber-600" : "text-stone-400"
                  }`}
                >
                  {s.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Card */}
      <Card className="p-8 shadow-xl border-stone-100 overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step 0: Choose Hero */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-stone-900">
                  Who is the Hero?
                </h2>
                <p className="text-stone-500 mt-2">
                  Select a trained model to star in your story
                </p>
              </div>

              {modelsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                </div>
              ) : models.length === 0 ? (
                <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200">
                  <Camera className="w-12 h-12 mx-auto text-stone-300 mb-4" />
                  <h3 className="text-lg font-medium text-stone-700 mb-2">
                    No Heroes Yet
                  </h3>
                  <p className="text-stone-500 mb-4">
                    Train a model with your child's photos first
                  </p>
                  <Button
                    onClick={() => router.push("/train")}
                    className="bg-stone-900 text-white"
                  >
                    Train Your Hero
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      onClick={() => {
                        setSelectedModelId(model.id);
                        setChildName(model.name);
                      }}
                      className={`cursor-pointer rounded-2xl overflow-hidden border-2 transition-all ${
                        selectedModelId === model.id
                          ? "border-amber-500 ring-4 ring-amber-100 scale-105"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <div className="aspect-square bg-stone-100">
                        {model.thumbnail ? (
                          <img
                            src={model.thumbnail}
                            alt={model.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-100 to-orange-100">
                            <span className="text-4xl font-bold text-amber-600">
                              {model.name[0]}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-white text-center border-t">
                        <span className="font-medium text-stone-900">
                          {model.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <Label>Hero's Name</Label>
                  <Input
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="Emma"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Age</Label>
                  <Input
                    type="number"
                    min={3}
                    max={12}
                    value={childAge}
                    onChange={(e) => setChildAge(Number(e.target.value))}
                    className="mt-1"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 1: Story Theme */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-stone-900">
                  What's the Adventure?
                </h2>
                <p className="text-stone-500 mt-2">
                  Choose a theme or write your own story idea
                </p>
              </div>

              {/* Quick starters */}
              <div className="space-y-3">
                <Label>Quick Starters</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {STORY_STARTERS.slice(0, 8).map((starter) => (
                    <button
                      key={starter.id}
                      onClick={() => {
                        setTheme(starter.theme);
                        setCategory(starter.category);
                      }}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        theme === starter.theme
                          ? "border-amber-500 bg-amber-50"
                          : "border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <span className="text-2xl block mb-1">{starter.icon}</span>
                      <span className="text-sm font-medium text-stone-900">
                        {starter.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom theme */}
              <div className="space-y-2">
                <Label>Or Write Your Own</Label>
                <Input
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="e.g., Travels to a magical forest and befriends talking animals..."
                  className="h-12"
                />
              </div>

              {/* Story length */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Story Length</Label>
                  <Select
                    value={storyLength}
                    onValueChange={(v) => setStoryLength(v as any)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(STORY_LENGTH_CONFIG).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STORY_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Art Style */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-stone-900">
                  Pick an Art Style
                </h2>
                <p className="text-stone-500 mt-2">
                  How should your storybook look?
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {ART_STYLES.map((style) => (
                  <div
                    key={style.id}
                    onClick={() => setArtStyle(style.id)}
                    className={`cursor-pointer p-6 rounded-2xl border-2 transition-all text-center ${
                      artStyle === style.id
                        ? "border-amber-500 bg-amber-50 scale-105"
                        : "border-stone-200 hover:border-stone-300 bg-stone-50"
                    }`}
                  >
                    <span className="text-4xl block mb-3">{style.preview}</span>
                    <span className="font-medium text-stone-900">{style.name}</span>
                  </div>
                ))}
              </div>

              {/* Dedication */}
              <div className="space-y-2 pt-4">
                <Label>Dedication (Optional)</Label>
                <Input
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  placeholder="To the bravest explorer we know — Mom & Dad"
                />
              </div>

              {/* Audio Narration */}
              <div className="space-y-4 pt-4 border-t border-stone-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                      <span className="text-xl">🎙️</span>
                    </div>
                    <div>
                      <Label className="text-base font-medium">Audio Narration</Label>
                      <p className="text-xs text-stone-500">Add voice-over to your story</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIncludeAudio(!includeAudio)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      includeAudio ? "bg-purple-600" : "bg-stone-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        includeAudio ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {includeAudio && (
                  <div className="space-y-2">
                    <Label>Voice Style</Label>
                    <Select value={voiceId} onValueChange={setVoiceId}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sarah">Sarah - Warm, friendly female</SelectItem>
                        <SelectItem value="rachel">Rachel - Clear, engaging female</SelectItem>
                        <SelectItem value="bella">Bella - Soft, nurturing female</SelectItem>
                        <SelectItem value="josh">Josh - Gentle male</SelectItem>
                        <SelectItem value="adam">Adam - Expressive male narrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Generate */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-stone-900">
                  Ready to Create Magic?
                </h2>
                <p className="text-stone-500 mt-2">
                  Review your choices and generate your personalized storybook
                </p>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-xs uppercase tracking-wide text-stone-500">
                      Hero
                    </span>
                    <p className="font-medium text-stone-900 text-lg">
                      {childName}, age {childAge}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-stone-500">
                      Story Length
                    </span>
                    <p className="font-medium text-stone-900">
                      {STORY_LENGTH_CONFIG[storyLength].label}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs uppercase tracking-wide text-stone-500">
                      Adventure Theme
                    </span>
                    <p className="font-medium text-stone-900">{theme}</p>
                  </div>
                  <div>
                    <span className="text-xs uppercase tracking-wide text-stone-500">
                      Art Style
                    </span>
                    <p className="font-medium text-stone-900">
                      {ART_STYLES.find((s) => s.id === artStyle)?.name}
                    </p>
                  </div>
                  {includeAudio && (
                    <div>
                      <span className="text-xs uppercase tracking-wide text-stone-500">
                        Audio Narration
                      </span>
                      <p className="font-medium text-stone-900 flex items-center gap-2">
                        <span>🎙️</span>
                        {voiceId === "sarah" && "Sarah - Warm & Friendly"}
                        {voiceId === "rachel" && "Rachel - Clear & Engaging"}
                        {voiceId === "bella" && "Bella - Soft & Nurturing"}
                        {voiceId === "josh" && "Josh - Gentle Male"}
                        {voiceId === "adam" && "Adam - Expressive Narrator"}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Info box */}
              <div className="flex items-start gap-3 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p>
                  Generation takes about{" "}
                  <strong>{STORY_LENGTH_CONFIG[storyLength].pages * 30} seconds</strong>. 
                  You'll be redirected to watch your story come to life!
                </p>
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">
                  {error}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between pt-8 mt-8 border-t border-stone-100">
          <Button
            variant="ghost"
            onClick={prevStep}
            disabled={step === 0 || loading}
            className="text-stone-500"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button
              onClick={nextStep}
              disabled={!canProceed()}
              className="bg-stone-900 text-white hover:bg-stone-800"
            >
              Continue <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={loading || !canProceed()}
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90 shadow-lg shadow-amber-200"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating Magic...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Story
                </>
              )}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export default StoryGenerator;

