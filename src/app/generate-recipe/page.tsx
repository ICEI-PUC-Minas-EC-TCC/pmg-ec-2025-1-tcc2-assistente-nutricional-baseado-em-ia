"use client";

import PersonalizedRecipeGenerator from "@/components/PersonalizedRecipeGenerator";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function GenerateRecipePage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login?redirect=/generate-recipe");
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex justify-center items-center min-h-screen">
        <LoadingSpinner text="Carregando..." />
      </div>
    );
  }
   if (!currentUser) {
     return (
      <div className="container mx-auto p-4 md:p-8 flex justify-center items-center min-h-screen">
        <LoadingSpinner text="Redirecionando para login..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <PersonalizedRecipeGenerator />
    </div>
  );
}
