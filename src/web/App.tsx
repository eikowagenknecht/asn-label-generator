import { LabelGeneratorForm } from "./components/LabelGeneratorForm";

function App() {
  return (
    <div className="bg-background">
      <div className="container mx-auto py-8">
        <div className="max-w-2xl mx-auto">
          <header className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              ASN Label Generator
            </h1>
          </header>
          <LabelGeneratorForm />
        </div>
      </div>
    </div>
  );
}

export default App;
