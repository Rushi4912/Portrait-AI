"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { BACKEND_URL } from "@/app/config";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Loader2, ChevronLeft, ChevronRight, Home, Download } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useParams } from "next/navigation";
import jsPDF from "jspdf";

interface StoryPage {
  id: string;
  pageNumber: number;
  content: string;
  imageUrl?: string;
  status: string;
}

interface Story {
  id: string;
  title: string;
  status: "Pending" | "Generating" | "Completed" | "Failed";
  pages: StoryPage[];
}

export default function StoryReader() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [story, setStory] = useState<Story | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [exporting, setExporting] = useState(false);
  
  // Polling logic
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const fetchStory = async () => {
      try {
        const token = await getToken();
        const res = await axios.get(`${BACKEND_URL}/story/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStory(res.data.story);
        
        // If generating, keep polling
        if (res.data.story.status === "Generating" || res.data.story.pages.some((p: any) => p.status === "Pending")) {
             // Poll every 3 seconds
        } else {
            clearInterval(intervalId);
        }
      } catch (error) {
        console.error("Failed to fetch story", error);
      }
    };

    fetchStory();
    intervalId = setInterval(fetchStory, 3000);

    return () => clearInterval(intervalId);
  }, [id, getToken]);

  if (!story) {
    return (
        <div className="h-screen flex items-center justify-center bg-stone-100">
            <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
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
      const doc = new jsPDF();
      doc.setFont("times", "bold");
      doc.setFontSize(20);
      doc.text(story.title, 10, 20);
      story.pages.forEach((page, index) => {
        if (index !== 0) doc.addPage();
        doc.setFont("times", "normal");
        doc.setFontSize(14);
        doc.text(`Page ${page.pageNumber}`, 10, 30);
        doc.setFontSize(12);
        const text = doc.splitTextToSize(page.content, 180);
        doc.text(text, 10, 40);
      });
      doc.save(`${story.title}.pdf`);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="h-screen bg-stone-900 flex flex-col items-center justify-center overflow-hidden">
      {/* Navigation Bar */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-center z-50 text-white/80">
        <Link href="/stories">
            <Button variant="ghost" className="hover:bg-white/10 hover:text-white">
                <Home className="w-5 h-5 mr-2" />
                Library
            </Button>
        </Link>
        <h1 className="font-serif font-bold text-xl tracking-wide">{story.title}</h1>
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={handleExportPdf} disabled={exporting}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            Export
          </Button>
        </div>
      </div>

      {/* Main Book Content */}
      <div className="w-full max-w-6xl h-[80vh] relative flex items-center justify-center">
        
        {/* Previous Button */}
        {!isFirstPage && (
            <button 
                onClick={() => setCurrentPageIndex(p => p - 1)}
                className="absolute left-4 z-20 p-4 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all"
            >
                <ChevronLeft className="w-8 h-8" />
            </button>
        )}

        {/* Page Content */}
        <div className="relative w-full max-w-5xl aspect-[16/9] bg-white rounded-sm shadow-2xl overflow-hidden flex">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={currentPageIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full h-full flex"
                >
                    {/* Left: Image */}
                    <div className="w-1/2 h-full bg-stone-100 relative">
                        {currentPage?.imageUrl ? (
                            <img 
                                src={currentPage.imageUrl} 
                                className="w-full h-full object-cover"
                                alt={`Page ${currentPage.pageNumber}`}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-amber-50">
                                <div className="text-center">
                                    <Loader2 className="w-8 h-8 animate-spin text-amber-500 mx-auto mb-2" />
                                    <p className="text-amber-800 font-medium">Illustrating...</p>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    {/* Right: Text */}
                    <div className="w-1/2 h-full p-12 flex flex-col justify-center bg-[#fdfbf7]">
                        <div className="font-serif text-2xl md:text-3xl leading-relaxed text-stone-800">
                            {currentPage?.content}
                        </div>
                        <div className="mt-8 text-center text-stone-400 font-sans text-sm">
                            Page {currentPageIndex + 1} of {story.pages.length}
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Next Button */}
        {!isLastPage && (
            <button 
                onClick={() => setCurrentPageIndex(p => p + 1)}
                className="absolute right-4 z-20 p-4 rounded-full bg-black/20 hover:bg-black/40 text-white transition-all"
            >
                <ChevronRight className="w-8 h-8" />
            </button>
        )}
      </div>
    </div>
  );
}

