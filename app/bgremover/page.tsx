import ImageSelector from "@/components/ImageSelector";

export default function ImagePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold mb-4">Image Background Remover</h1>
      <ImageSelector />
    </main>
  );
}
