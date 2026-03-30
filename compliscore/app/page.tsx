import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ScanForm } from "@/components/scan-form";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Votre site est-il conforme
            <br />
            <span className="text-primary">au RGPD ?</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Scan gratuit en 30 secondes. Découvrez votre score de conformité
            RGPD et cybersécurité, avec des recommandations concrètes.
          </p>
          <div className="mx-auto mt-10 flex justify-center">
            <ScanForm />
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border bg-muted/30 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-center text-2xl font-semibold mb-12">
              Comment ça marche ?
            </h2>
            <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
              <Step
                number={1}
                title="Entrez votre domaine"
                description="Saisissez l'URL de votre site web dans le champ ci-dessus."
              />
              <Step
                number={2}
                title="Analyse automatique"
                description="Notre scanner vérifie la conformité RGPD, les headers de sécurité, les cookies, le DNS et plus encore."
              />
              <Step
                number={3}
                title="Recevez votre score"
                description="Obtenez un score de 0 à 100 avec une liste détaillée des points à corriger."
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-lg font-bold mb-4">
        {number}
      </div>
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
