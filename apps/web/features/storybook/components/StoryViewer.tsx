"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  ChevronLeft,
  ChevronRight,
  Home,
  Download,
  Loader2,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Maximize2,
  RefreshCw,
} from "lucide-react";
import jsPDF from "jspdf";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { BACKEND_URL } from "../../../app/config";
import { GenerationProgress } from "@/features/generator";

interface StoryPage {
  id: string;
  pageNumber: number;
  content: string;
  imageUrl?: string;
  audioUrl?: string;
  status: string;
}

interface Story {
  id: string;
  title: string;
  status: "Pending" | "Generating" | "Completed" | "Failed";
  childName?: string;
  dedication?: string;
  pages: StoryPage[];
  model: {
    name: string;
    thumbnail?: string;
  };
  progress?: number;
  generatedPages?: number;
  failedPages?: number;
  totalPages?: number;
}

interface StoryViewerProps {
  storyId: string;
}

export function StoryViewer({ storyId }: StoryViewerProps) {
  const router = useRouter();
  const { getToken } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);

  const [story, setStory] = useState<Story | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  // Fetch story with polling for generating state
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStory = async () => {
      try {
        const token = await getToken?.();
        if (!token) return;

        const res = await axios.get(`${BACKEND_URL}/story/${storyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setStory(res.data.story);
        setLoading(false);

        // Stop polling if story is complete or failed
        if (
          res.data.story.status === "Completed" ||
          res.data.story.status === "Failed"
        ) {
          clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Failed to fetch story", error);
        setLoading(false);
      }
    };

    fetchStory();
    intervalId = setInterval(fetchStory, 3000);

    return () => clearInterval(intervalId);
  }, [storyId, getToken]);

  // Auto-play audio when page changes
  useEffect(() => {
    if (autoPlay && audioRef.current && currentPage?.audioUrl) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [currentPageIndex, autoPlay]);

  // Handle audio end - auto advance to next page
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => {
      setIsPlaying(false);
      if (autoPlay && !isLastPage) {
        setTimeout(() => setCurrentPageIndex((p) => p + 1), 500);
      }
    };

    audio.addEventListener("ended", handleEnded);
    return () => audio.removeEventListener("ended", handleEnded);
  }, [autoPlay, currentPageIndex]);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-900">
        <Loader2 className="w-12 h-12 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="h-screen flex items-center justify-center bg-stone-100">
        <div className="text-center">
          <h2 className="text-2xl font-serif text-stone-900 mb-4">
            Story not found
          </h2>
          <Button onClick={() => router.push("/stories")}>
            Return to Library
          </Button>
        </div>
      </div>
    );
  }

  // Show generation progress if still generating
  if (story.status === "Generating" || story.status === "Pending") {
    const completedPages = story.pages.filter(
      (p) => p.status === "Generated"
    ).length;
    const failedPages = story.pages.filter((p) => p.status === "Failed").length;
    const progress = story.pages.length
      ? Math.round((completedPages / story.pages.length) * 100)
      : 0;

    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <GenerationProgress
          storyId={story.id}
          totalPages={story.pages.length}
          currentStage={failedPages > 0 ? "error" : "images"}
          progress={progress}
          completedPages={completedPages}
          failedPages={failedPages}
          onRetry={async () => {
            const token = await getToken?.();
            await axios.post(
              `${BACKEND_URL}/story/${story.id}/retry-page`,
              { pageId: story.pages.find((p) => p.status === "Failed")?.id },
              { headers: { Authorization: `Bearer ${token}` } }
            );
          }}
        />
      </div>
    );
  }

  const currentPage = story.pages[currentPageIndex];
  const isLastPage = currentPageIndex === story.pages.length - 1;
  const isFirstPage = currentPageIndex === 0;

  const handleExportPdf = async () => {
    if (!story) return;
    setExporting(true);

    try {
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      // Title page
      doc.setFont("times", "bold");
      doc.setFontSize(32);
      doc.text(story.title, 148.5, 80, { align: "center" });

      if (story.childName) {
        doc.setFontSize(18);
        doc.setFont("times", "italic");
        doc.text(`Starring ${story.childName}`, 148.5, 100, { align: "center" });
      }

      if (story.dedication) {
        doc.setFontSize(12);
        doc.setFont("times", "italic");
        doc.text(story.dedication, 148.5, 180, { align: "center" });
      }

      // Story pages
      for (const page of story.pages) {
        doc.addPage();

        // Try to add image
        if (page.imageUrl) {
          try {
            const img = new Image();
            img.crossOrigin = "anonymous";
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = page.imageUrl!;
            });
            doc.addImage(img, "JPEG", 10, 10, 130, 90);
          } catch {
            // Skip image if loading fails
          }
        }

        // Add text
        doc.setFont("times", "normal");
        doc.setFontSize(14);
        const text = doc.splitTextToSize(page.content, 130);
        doc.text(text, 150, 30);

        // Page number
        doc.setFontSize(10);
        doc.text(`Page ${page.pageNumber}`, 148.5, 200, { align: "center" });
      }

      doc.save(`${story.title}.pdf`);
    } catch (error) {
      console.error("PDF export failed", error);
    } finally {
      setExporting(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div
      className={`h-screen bg-stone-900 flex flex-col ${
        isFullscreen ? "fixed inset-0 z-50" : ""
      }`}
    >
      {/* Top Navigation */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-50 bg-gradient-to-b from-black/50 to-transparent">
        <Button
          variant="ghost"
          className="text-white/80 hover:text-white hover:bg-white/10"
          onClick={() => router.push("/stories")}
        >
          <Home className="w-5 h-5 mr-2" />
          Library
        </Button>

        <h1 className="font-serif font-bold text-xl text-white/90 tracking-wide">
          {story.title}
        </h1>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={toggleFullscreen}
          >
            <Maximize2 className="w-5 h-5" />
          </Button>
          <Button
            variant="ghost"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={handleExportPdf}
            disabled={exporting}
          >
            {exporting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-20">
        {/* Previous Button */}
        <button
          onClick={() => setCurrentPageIndex((p) => p - 1)}
          disabled={isFirstPage}
          className={`absolute left-4 z-20 p-4 rounded-full transition-all ${
            isFirstPage
              ? "opacity-30 cursor-not-allowed"
              : "bg-black/20 hover:bg-black/40 text-white"
          }`}
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {/* Book Pages */}
        <div className="w-full max-w-6xl aspect-[16/9] relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPageIndex}
              initial={{ opacity: 0, rotateY: -10 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: 10 }}
              transition={{ duration: 0.4 }}
              className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden flex"
              style={{ perspective: "1000px" }}
            >
              {/* Left: Image */}
              <div className="w-1/2 h-full bg-stone-100 relative">
                {currentPage?.imageUrl ? (
                  <img
                    src={currentPage.imageUrl}
                    alt={`Page ${currentPage.pageNumber}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-50">
                    <div className="text-center">
                      <Loader2 className="w-12 h-12 animate-spin text-amber-400 mx-auto mb-3" />
                      <p className="text-amber-700 font-medium">
                        Illustrating...
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Text */}
              <div className="w-1/2 h-full p-8 md:p-12 flex flex-col justify-center bg-[#fdfbf7] relative">
                {/* Decorative book binding */}
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gradient-to-r from-stone-200 to-transparent" />

                <div className="font-serif text-xl md:text-2xl lg:text-3xl leading-relaxed text-stone-800">
                  {currentPage?.content}
                </div>

                {/* Page number */}
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <span className="text-stone-400 text-sm font-sans">
                    Page {currentPageIndex + 1} of {story.pages.length}
                  </span>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Next Button */}
        <button
          onClick={() => setCurrentPageIndex((p) => p + 1)}
          disabled={isLastPage}
          className={`absolute right-4 z-20 p-4 rounded-full transition-all ${
            isLastPage
              ? "opacity-30 cursor-not-allowed"
              : "bg-black/20 hover:bg-black/40 text-white"
          }`}
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Audio Controls */}
      {currentPage?.audioUrl && (
        <audio ref={audioRef} src={currentPage.audioUrl} muted={isMuted} />
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
        <div className="max-w-md mx-auto flex items-center justify-center gap-4">
          {/* Mute toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="text-white/80 hover:text-white hover:bg-white/10"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </Button>

          {/* Play/Pause */}
          {currentPage?.audioUrl && (
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:text-white hover:bg-white/10 w-12 h-12"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6" />
              )}
            </Button>
          )}

          {/* Auto-play toggle */}
          <Button
            variant="ghost"
            className={`text-sm ${
              autoPlay
                ? "text-amber-400 hover:text-amber-300"
                : "text-white/60 hover:text-white"
            }`}
            onClick={() => setAutoPlay(!autoPlay)}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Auto-play {autoPlay ? "On" : "Off"}
          </Button>
        </div>

        {/* Page dots */}
        <div className="flex justify-center gap-2 mt-4">
          {story.pages.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPageIndex(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentPageIndex
                  ? "bg-amber-400 w-6"
                  : "bg-white/40 hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default StoryViewer;

