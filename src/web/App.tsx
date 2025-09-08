import { LabelGeneratorForm } from "./components/LabelGeneratorForm";

function App() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              ASN Label Generator
            </h1>
            <p className="text-muted-foreground">
              Create professional labels for your paperless-ngx document
              management system
            </p>
          </header>
          <LabelGeneratorForm />
        </div>
      </div>
    </div>
  );
}

export default App;
