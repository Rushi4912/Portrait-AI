"use client";

import { GenerateImage } from "@/components/GenerateImage";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Train } from "../../components/Train";
import { Packs } from "@/components/Packs";
import { Camera } from "@/components/Camera";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CameraIcon, Image, Package, Zap, User, Sparkles, Play, Upload, Settings } from "lucide-react";

export default function DashboardPage() {

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="space-y-8">
          <Tabs defaultValue="camera">
            <TabsList className="inline-flex h-12 items-center justify-start rounded-lg p-1 bg-gray-900 border border-gray-800">
              <TabsTrigger
                value="camera"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400 hover:text-white cursor-pointer px-4 py-2 rounded-md transition-colors"
              >
                <CameraIcon className="w-4 h-4 mr-2" />
                Camera
              </TabsTrigger>
              <TabsTrigger
                value="generate"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400 hover:text-white cursor-pointer px-4 py-2 rounded-md transition-colors"
              >
                <Image className="w-4 h-4 mr-2" />
                Generate
                <span className="ml-1 px-2 py-1 bg-yellow-500 text-black text-xs rounded-full">NEW</span>
              </TabsTrigger>
              <TabsTrigger
                value="packs"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400 hover:text-white cursor-pointer px-4 py-2 rounded-md transition-colors"
              >
                <Package className="w-4 h-4 mr-2" />
                Packs
              </TabsTrigger>
              <TabsTrigger
                value="train"
                className="data-[state=active]:bg-gray-800 data-[state=active]:text-white text-gray-400 hover:text-white cursor-pointer px-4 py-2 rounded-md transition-colors"
              >
                <Zap className="w-4 h-4 mr-2" />
                Train
              </TabsTrigger>
            </TabsList>

            {/* Secondary Navigation */}
            <div className="flex items-center space-x-8 mt-6 border-b border-gray-800">
              <button className="flex items-center space-x-2 pb-3 border-b-2 border-white">
                <span className="text-sm font-medium">All</span>
              </button>
              <button className="flex items-center space-x-2 pb-3 text-gray-400 hover:text-white">
                <User className="w-4 h-4" />
                <span className="text-sm">Portraits</span>
              </button>
              <button className="flex items-center space-x-2 pb-3 text-gray-400 hover:text-white">
                <Image className="w-4 h-4" />
                <span className="text-sm">Selfies</span>
              </button>
              <button className="flex items-center space-x-2 pb-3 text-gray-400 hover:text-white">
                <Package className="w-4 h-4" />
                <span className="text-sm">Frames</span>
              </button>
              <button className="flex items-center space-x-2 pb-3 text-gray-400 hover:text-white">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm">Effects</span>
              </button>
              <button className="flex items-center space-x-2 pb-3 text-gray-400 hover:text-white">
                <Play className="w-4 h-4" />
                <span className="text-sm">Scenes</span>
              </button>
            </div>

            {/* Main Content Area */}
            <div className="mt-8 min-h-[60vh]">
              <TabsContent value="camera" className="mt-0 focus-visible:outline-none">
                <Camera />
              </TabsContent>
              <TabsContent value="generate" className="mt-0 focus-visible:outline-none">
                <GenerateImage />
              </TabsContent>
              <TabsContent value="packs" className="mt-0 focus-visible:outline-none">
                <Packs />
              </TabsContent>
              <TabsContent value="train" className="mt-0 focus-visible:outline-none">
                <Train />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Bottom Input Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 p-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center space-x-4 mb-4">
              <div className="flex-1 relative">
                <Input
                  placeholder="Describe your story"
                  className="w-full bg-gray-900 border-gray-700 text-white placeholder-gray-400 pr-12 h-12 rounded-lg"
                />
                <Button size="sm" className="absolute right-1 top-1 bg-white text-black hover:bg-gray-200">
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
              <Button size="sm" className="bg-white text-black hover:bg-gray-200 h-12 px-6">
                <Sparkles className="w-4 h-4 mr-2" />
                Generate
              </Button>
            </div>
            
            {/* Bottom Navigation */}
            <div className="flex items-center justify-center space-x-8 text-gray-400">
              <button className="flex flex-col items-center space-y-1 hover:text-white">
                <Package className="w-5 h-5" />
                <span className="text-xs">Frames</span>
              </button>
              <button className="flex flex-col items-center space-y-1 hover:text-white">
                <Play className="w-5 h-5" />
                <span className="text-xs">Scenes</span>
              </button>
              <button className="flex flex-col items-center space-y-1 hover:text-white">
                <Sparkles className="w-5 h-5" />
                <span className="text-xs">Effects</span>
              </button>
              <button className="flex flex-col items-center space-y-1 hover:text-white">
                <Image className="w-5 h-5" />
                <span className="text-xs">Swaps</span>
              </button>
              <button className="flex flex-col items-center space-y-1 hover:text-white">
                <User className="w-5 h-5" />
                <span className="text-xs">Portraits</span>
              </button>
              <button className="flex flex-col items-center space-y-1 hover:text-white">
                <div className="w-5 h-5 bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-xs">15</span>
                </div>
                <span className="text-xs">Credits</span>
              </button>
              <button className="flex flex-col items-center space-y-1 hover:text-white">
                <Settings className="w-5 h-5" />
                <span className="text-xs">Settings</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}