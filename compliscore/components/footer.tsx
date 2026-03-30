export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/50 py-6">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>
          CompliScore fournit un score indicatif et ne constitue pas un audit
          légal. Pour un audit complet, consultez un professionnel qualifié.
        </p>
        <p className="mt-2">
          &copy; {new Date().getFullYear()} CompliScore. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
}
