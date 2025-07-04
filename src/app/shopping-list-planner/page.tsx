
"use client";

import ShoppingListRecipePlanner from "@/components/ShoppingListRecipePlanner";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export default function ShoppingListPlannerPage() {
  const { currentUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !currentUser) {
      router.push("/login?redirect=/shopping-list-planner");
    }
  }, [currentUser, isLoading, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 md:p-8 flex justify-center items-center min-h-screen">
        <LoadingSpinner text="Carregando planejador de compras..." />
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
      <ShoppingListRecipePlanner />
    </div>
  );
}
