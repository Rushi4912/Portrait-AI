"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Hero } from "@/components/home/Hero";
import { useAuth } from "@/hooks/useAuth";


export default function Home() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  return (
    <div>
      <Hero />
    </div>
  );
}