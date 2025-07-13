import Header from "@/components/header";
import ImageGenerator from "@/components/image-generator";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <ImageGenerator />
      </main>
    </div>
  );
}
