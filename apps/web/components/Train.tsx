"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { UploadModal } from "@/components/ui/upload";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { BACKEND_URL, CLOUDFLARE_URL } from "../app/config";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { X, ImageIcon, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import Image from "next/image";
import JSZip from "jszip";

interface UploadedFile {
  name: string;
  status: "uploaded" | "failed";
  timestamp: Date;
}

const STEPS = [
  { title: "Upload Photos", description: "5-10 high quality selfies." },
  { title: "Describe the Hero", description: "Basic characteristics." },
  { title: "Review & Train", description: "Confirm and start." },
];

export function Train() {
  const { getToken } = useAuth();
  const [zipUrl, setZipUrl] = useState("");
  const [zipKey, setZipKey] = useState("");
  const [type, setType] = useState("Man");
  const [age, setAge] = useState<string>("5");
  const [ethinicity, setEthinicity] = useState<string>("White");
  const [eyeColor, setEyeColor] = useState<string>("Brown");
  const [bald, setBald] = useState(false);
  const [name, setName] = useState("");
  const [modelTraining, setModelTraining] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const router = useRouter();
  const { credits } = useCredits();
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [previewFiles, setPreviewFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [modelId, setModelId] = useState<string | null>(null);
  const [trainingStatus, setTrainingStatus] = useState<string | null>(null);

  // Check training status periodically if we have a modelId
  useEffect(() => {
    if (!modelId) return;

    const checkStatus = async () => {
      try {
        const token = await getToken();
        const response = await axios.get(
          `${BACKEND_URL}/model/status/${modelId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (response.data.success) {
          setTrainingStatus(response.data.model.status);

          // If training is complete, stop checking
          if (
            response.data.model.status === "Generated" ||
            response.data.model.status === "Failed"
          ) {
            if (response.data.model.status === "Generated") {
              toast.success("Model training completed successfully!");
              router.refresh();
            } else {
              toast.error("Model training failed. Please try again.");
            }
            setModelId(null);
            setModelTraining(false);
          }
        }
      } catch (error) {
        console.error("Error checking model status:", error);
      }
    };

    checkStatus();

    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [modelId, getToken, router]);

  async function trainModal() {
    if (credits <= 0) {
      toast.error("You don't have enough credits");
      router.push("/pricing");
      return;
    }

    if (!zipUrl) {
      toast.error("Please upload images first");
      return;
    }

    if (!name) {
      toast.error("Please enter a model name");
      return;
    }

    if (!type || !age || !ethinicity || !eyeColor) {
      toast.error("Please fill in all required fields");
      return;
    }

    const input = {
      zipUrl,
      type,
      age: Number.parseInt(age ?? "25"),
      ethinicity,
      eyeColor,
      bald,
      name,
    };

    try {
      const token = await getToken();
      setModelTraining(true);

      const response = await axios.post(`${BACKEND_URL}/ai/training`, input, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.modelId) {
        setModelId(response.data.modelId);
        toast.success(
          "Model training started! This will take approximately 20 minutes."
        );
      } else {
        toast.error("Failed to start model training");
        setModelTraining(false);
      }
    } catch (error) {
      console.error("Training error:", error);
      toast.error(
        (error as any).response?.data?.message ||
          "Failed to start model training"
      );
      setModelTraining(false);
    }
  }

  const handleRemoveFile = (indexToRemove: number) => {
    setUploadedFiles((prev) => {
      const newFiles = prev.filter((_, index) => index !== indexToRemove);
      if (newFiles.length === 0) {
        setZipUrl("");
        setZipKey("");
      }
      return newFiles;
    });
  };

  const handleUpload = async (files: File[]) => {
    if (files.length > 50) {
      toast.error("Maximum 50 images allowed");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setPreviewFiles(files);

    try {
      const res = await axios.get(`${BACKEND_URL}/pre-signed-url`);
      const { url, key } = res.data;

      const zip = new JSZip();
      const fileNames: string[] = [];

      for (const file of files) {
        zip.file(file.name, await file.arrayBuffer());
        fileNames.push(file.name);
        setUploadProgress((prev) => Math.min(prev + 50 / files.length, 50));
      }

      const content = await zip.generateAsync({ type: "blob" });

      await axios.put(url, content, {
        headers: {
          "Content-Type": "application/zip",
        },
        onUploadProgress: (progressEvent) => {
          setUploadProgress(
            50 + Math.round((progressEvent.loaded * 50) / progressEvent.total!)
          );
        },
      });

      const fullZipUrl = `${CLOUDFLARE_URL}/${key}`;
      setZipUrl(fullZipUrl);
      setZipKey(key);

      setUploadedFiles((prev) => [
        ...prev,
        ...fileNames.map((name) => ({
          name,
          status: "uploaded" as const,
          timestamp: new Date(),
        })),
      ]);

      toast.success("Images uploaded successfully!");
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload images. Please try again.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const isFormValid = name && zipUrl && type && age && ethinicity && eyeColor;

  const nextStep = () => setActiveStep((prev) => Math.min(prev + 1, STEPS.length - 1));
  const prevStep = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  return (
    <div className="min-h-screen bg-[#faf9f6] pt-32 pb-20 px-4 flex items-start justify-center">
      <div className="w-full max-w-4xl">
        
        {/* Header */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-serif font-bold text-stone-900 mb-4">Train Your Hero</h1>
          <p className="text-stone-500 max-w-lg mx-auto">
            Create a custom AI model of your child. Upload 5-10 photos, and we&apos;ll teach our AI how to illustrate them in any adventure.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-12 max-w-2xl mx-auto px-4">
          {STEPS.map((step, index) => {
            const isActive = index === activeStep;
            const isCompleted = index < activeStep;
            
            return (
              <div key={step.title} className="flex flex-col items-center relative z-10">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 mb-2
                    ${isActive ? "bg-stone-900 text-white scale-110 shadow-lg" : 
                      isCompleted ? "bg-green-500 text-white" : "bg-stone-200 text-stone-400"}`}
                >
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                </div>
                <span className={`text-xs font-medium transition-colors duration-300 ${isActive ? "text-stone-900" : "text-stone-400"}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
          {/* Progress Bar Background */}
          <div className="absolute left-0 right-0 top-5 h-[2px] bg-stone-200 -z-0 hidden md:block max-w-2xl mx-auto" />
          {/* Active Progress Bar */}
           <div 
            className="absolute left-0 top-5 h-[2px] bg-stone-900 -z-0 hidden md:block max-w-2xl mx-auto transition-all duration-500" 
            style={{ width: `${(activeStep / (STEPS.length - 1)) * 100}%` }}
          />
        </div>

        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          <div className="grid md:grid-cols-12 min-h-[500px]">
            
            {/* Left Panel: Form */}
            <div className="md:col-span-7 p-8 md:p-10 flex flex-col">
              <div className="flex-1">
                <AnimatePresence mode="wait">
                  
                  {/* Step 1: Upload */}
                  {activeStep === 0 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h2 className="text-2xl font-serif font-bold text-stone-900">Upload Photos</h2>
                        <div className="flex gap-2 text-sm text-stone-500 bg-blue-50 p-3 rounded-xl border border-blue-100">
                          <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
                          <p>Best results: Close-ups, different angles, good lighting. Avoid sunglasses or hats.</p>
                        </div>
                      </div>

                      <UploadModal handleUpload={handleUpload} isUploading={isUploading} uploadProgress={uploadProgress} />

                      {uploadedFiles.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-stone-900">Uploaded ({uploadedFiles.length})</p>
                          <div className="grid grid-cols-3 gap-2">
                            {uploadedFiles.slice(0, 6).map((file, i) => (
                                <div key={i} className="bg-stone-50 rounded-lg p-2 text-xs truncate text-stone-500 border border-stone-100">
                                    {file.name}
                                </div>
                            ))}
                            {uploadedFiles.length > 6 && (
                                <div className="bg-stone-50 rounded-lg p-2 text-xs text-stone-500 border border-stone-100 flex items-center justify-center">
                                    +{uploadedFiles.length - 6} more
                                </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* Step 2: Details */}
                  {activeStep === 1 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h2 className="text-2xl font-serif font-bold text-stone-900">Describe the Hero</h2>
                        <p className="text-stone-500">Help the AI understand the physical traits.</p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Child&apos;s Name</Label>
                            <Input 
                                placeholder="e.g. Leo" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                className="h-12 text-lg bg-stone-50 border-stone-200 focus:border-stone-900 focus:ring-0 rounded-xl"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Age</Label>
                                <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="h-12 rounded-xl bg-stone-50" />
                            </div>
                             <div className="space-y-2">
                                <Label>Eye Color</Label>
                                <Select value={eyeColor} onValueChange={setEyeColor}>
                                    <SelectTrigger className="h-12 rounded-xl bg-stone-50"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {["Brown", "Blue", "Hazel", "Green", "Gray"].map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Ethnicity</Label>
                                <Select value={ethinicity} onValueChange={setEthinicity}>
                                    <SelectTrigger className="h-12 rounded-xl bg-stone-50"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {["White", "Black", "Asian", "Hispanic", "Middle Eastern", "Mixed"].map(c => (
                                            <SelectItem key={c} value={c}>{c}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Hair Length</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger className="h-12 rounded-xl bg-stone-50"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Man">Short Hair</SelectItem>
                                        <SelectItem value="Woman">Long Hair</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Review */}
                  {activeStep === 2 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-2">
                        <h2 className="text-2xl font-serif font-bold text-stone-900">Ready to Train?</h2>
                        <p className="text-stone-500">Double check the details below.</p>
                      </div>

                      <div className="bg-stone-50 rounded-2xl p-6 space-y-4 border border-stone-100">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-stone-400 text-xs uppercase tracking-wide">Name</p>
                                <p className="font-medium text-stone-900 text-lg">{name}</p>
                            </div>
                            <div>
                                <p className="text-stone-400 text-xs uppercase tracking-wide">Photos</p>
                                <p className="font-medium text-stone-900 text-lg">{uploadedFiles.length} files</p>
                            </div>
                            <div>
                                <p className="text-stone-400 text-xs uppercase tracking-wide">Age</p>
                                <p className="font-medium text-stone-900">{age} years</p>
                            </div>
                            <div>
                                <p className="text-stone-400 text-xs uppercase tracking-wide">Eyes</p>
                                <p className="font-medium text-stone-900">{eyeColor}</p>
                            </div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 bg-amber-50 text-amber-800 p-4 rounded-xl text-sm">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <p>Training costs <strong>20 credits</strong> and takes about <strong>20 minutes</strong>. You&apos;ll be notified when your model is ready to star in stories.</p>
                      </div>
                    </motion.div>
                  )}

                </AnimatePresence>
              </div>

              {/* Navigation Buttons */}
              <div className="pt-8 mt-8 border-t border-stone-100 flex justify-between">
                 <Button 
                    variant="ghost" 
                    onClick={prevStep} 
                    disabled={activeStep === 0 || modelTraining}
                    className="text-stone-500 hover:text-stone-900"
                 >
                    Back
                 </Button>
                 
                 {activeStep < 2 ? (
                    <Button 
                        onClick={nextStep} 
                        disabled={(activeStep === 0 && uploadedFiles.length === 0) || (activeStep === 1 && !name)}
                        className="bg-stone-900 text-white hover:bg-stone-800 px-8 rounded-full"
                    >
                        Continue
                    </Button>
                 ) : (
                    <Button 
                        onClick={trainModal} 
                        disabled={modelTraining}
                        className="bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:opacity-90 px-8 rounded-full shadow-lg shadow-orange-200"
                    >
                        {modelTraining ? "Starting Engine..." : `Start Training (${credits} credits)`}
                    </Button>
                 )}
              </div>
            </div>

            {/* Right Panel: Visuals */}
            <div className="md:col-span-5 bg-stone-50 border-l border-stone-100 p-8 flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cube-coat.png')] opacity-5"></div>
                
                {previewFiles.length > 0 ? (
                    <div className="relative z-10 w-full max-w-xs">
                        <p className="text-center text-xs font-bold uppercase tracking-widest text-stone-400 mb-6">Preview</p>
                        <div className="grid grid-cols-2 gap-3 rotate-2 hover:rotate-0 transition-transform duration-500">
                            {previewFiles.slice(0, 4).map((file, i) => (
                                <div key={i} className="aspect-square rounded-2xl overflow-hidden shadow-md border-2 border-white">
                                    <Image
                                        src={URL.createObjectURL(file)}
                                        alt="Preview"
                                        width={150}
                                        height={150}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ))}
                        </div>
                         <p className="text-center text-stone-400 text-xs mt-6">
                            {previewFiles.length} images selected
                        </p>
                    </div>
                ) : (
                     <div className="text-center z-10 opacity-40">
                        <div className="w-24 h-24 bg-stone-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <ImageIcon className="w-10 h-10 text-stone-400" />
                        </div>
                        <p className="font-serif text-xl text-stone-400">Your Hero<br/>Starts Here</p>
                    </div>
                )}
            </div>

          </div>
        </Card>
      </div>
    </div>
  );
}
