"use client";

import { Button } from "@/components/ui/button";

export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-4xl font-bold text-destructive">Erreur</h1>
        <p className="text-muted-foreground mt-4 max-w-md">
          Une erreur inattendue est survenue. Veuillez réessayer.
        </p>
        <Button onClick={reset} className="mt-6">
          Réessayer
        </Button>
      </div>
    </div>
  );
}
