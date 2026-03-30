import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";

export default function ScanNotFound() {
  return (
    <>
      <Header />
      <main className="flex-1 flex items-center justify-center">
        <div className="text-center px-4 py-20">
          <h1 className="text-6xl font-bold text-muted-foreground">404</h1>
          <h2 className="text-xl font-semibold mt-4">Scan non trouvé</h2>
          <p className="text-muted-foreground mt-2 max-w-md">
            Ce scan n&apos;existe pas ou a expiré. Lancez un nouveau scan pour
            analyser votre site.
          </p>
          <Link href="/">
            <Button className="mt-6">Nouveau scan</Button>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
