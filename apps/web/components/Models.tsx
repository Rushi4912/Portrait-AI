"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import axios from "axios";
import Image from "next/image";
import { motion } from "framer-motion";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface TModel {
  id: string;
  thumbnail: string;
  name: string;
  trainingStatus: "Generated" | "Pending";
}

export function SelectModel({
  setSelectedModel,
  selectedModel,
}: {
  setSelectedModel: (model: string) => void;
  selectedModel?: string;
}) {
  const { getToken } = useAuth();
  const [modelLoading, setModelLoading] = useState(true); // ✅ Start as true
  const [models, setModels] = useState<TModel[]>([]);
  const [error, setError] = useState<string | null>(null); // ✅ Add error state
  const baseurl = "http://localhost:8080";

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setModelLoading(true); 
        setError(null); 
        
        const token = await getToken();
        console.log(token); 
        
        const response = await axios.get(`${baseurl}/models`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        console.log("Models response:", response.data); // ✅ Debug log
        
        setModels(response.data.models || []);
        
        // Only set selected model if we have models
        // if (response.data.models && response.data.models.length > 0) {
        //   setSelectedModel(response.data.models[0]?.id);
        // }
        setSelectedModel(response.data.models[0]?.id);
      } catch (error) {
        console.error("Failed to fetch models:", error); 
        setError("Failed to load models");
      } finally {
        setModelLoading(false); 
      }
    };

    fetchModels();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  // ✅ Show error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center p-12 rounded-lg border border-dashed border-red-200">
          <p className="text-red-500">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-sm text-blue-500 hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="md:space-y-1">
          <h2 className="md:text-2xl text-xl font-semibold tracking-tight">
            Select Model
          </h2>
          <p className="text-sm text-muted-foreground">
            Choose an AI model to generate your images
          </p>
        </div>
        {models.find((x) => x.trainingStatus !== "Generated") && (
          <Badge variant="secondary" className="animate-pulse">
            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
            Training in progress
          </Badge>
        )}
      </div>

      {modelLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((_, i) => (
            <Card key={i} className="h-[220px] animate-pulse bg-muted/50" />
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {models
            .filter((model) => model.trainingStatus === "Generated")
            .map((model) => (
              <motion.div key={model.id} variants={item}>
                <Card
                  className={cn(
                    "group relative max-w-96 overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer",
                    selectedModel === model.id && "ring-2 ring-primary"
                  )}
                  onClick={() => setSelectedModel(model.id)}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={model.thumbnail}
                      alt={`Thumbnail for ${model.name}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">
                          {model.name}
                        </h3>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
        </motion.div>
      )}

      {!modelLoading && models.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center p-12 rounded-lg border border-dashed"
        >
          <Sparkles className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium">No models available</h3>
          <p className="mt-2 text-sm text-muted-foreground text-center">
            Start by training a new model or check if your models have "Generated" status
          </p>
        </motion.div>
      )}
      
      {/* ✅ Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
          <p>Debug: Found {models.length} total models</p>
          <p>Generated models: {models.filter(m => m.trainingStatus === "Generated").length}</p>
        </div>
      )}
    </div>
  );
}