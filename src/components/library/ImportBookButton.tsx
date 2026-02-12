import { useState } from "react";
import { Plus, Upload, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useApp } from "@/contexts/AppContext";
import ePub from "epubjs";
import * as pdfjsLib from "pdfjs-dist";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker?url";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "@/lib/firebase";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

export function ImportBookButton() {
  const [open, setOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  const { addBook, userId } = useApp();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      void handleFile(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      void handleFile(files[0]);
    }
  };

  const extractEpubText = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub(arrayBuffer);
    await (book as any).ready;

    const spineItems =
      (book as any).spine?.spineItems ?? (book as any).spine?.items ?? [];
    const chunks: string[] = [];

    for (const item of spineItems) {
      try {
        const doc = await item.load((book as any).load.bind(book));
        const text = doc?.body?.textContent ?? "";
        if (text.trim()) {
          chunks.push(text.trim());
        }
        item.unload();
      } catch {
        // Ignore individual spine errors; continue with other sections.
      }
    }

    const metadataTitle =
      (book as any).package?.metadata?.title ||
      (book as any).package?.metadata?.titles?.[0];

    return {
      content: chunks.join("\n\n"),
      title: typeof metadataTitle === "string" ? metadataTitle : undefined,
    };
  };

  const extractPdfText = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const chunks: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (pageText) {
        chunks.push(pageText);
      }
    }

    let metadataTitle: string | undefined;
    try {
      const metadata = await pdf.getMetadata();
      const title = (metadata as any)?.info?.Title;
      if (typeof title === "string" && title.trim()) {
        metadataTitle = title.trim();
      }
    } catch {
      // ignore metadata errors
    }

    return {
      content: chunks.join("\n\n"),
      title: metadataTitle,
    };
  };

  const uploadBookContent = async (bookId: string, content: string) => {
    if (!userId) {
      throw new Error("missing-user");
    }
    const storagePath = `users/${userId}/books/${bookId}/content.txt`;
    const contentRef = ref(storage, storagePath);
    const blob = new Blob([content], { type: "text/plain" });
    await uploadBytes(contentRef, blob);
    return getDownloadURL(contentRef);
  };

  const handleFile = async (file: File) => {
    const validTypes = ["application/epub+zip", "application/pdf"];
    const extension = file.name.split(".").pop()?.toLowerCase();

    if (
      extension === "epub" ||
      extension === "pdf" ||
      validTypes.includes(file.type)
    ) {
      try {
        if (!userId) {
          toast({
            title: "Autentificare în curs",
            description:
              "Te rugăm să aștepți câteva secunde și încearcă din nou.",
            variant: "destructive",
          });
          return;
        }

        setIsImporting(true);

        const { content, title: extractedTitle } =
          extension === "epub"
            ? await extractEpubText(file)
            : await extractPdfText(file);

        if (!content.trim()) {
          throw new Error("empty-content");
        }

        const bookId = generateId();
        const contentUrl = await uploadBookContent(bookId, content);

        // create a minimal Book metadata object and add to app state
        const fallbackTitle = file.name.replace(/\.[^/.]+$/, "");
        const newBook = {
          id: bookId,
          title: extractedTitle?.trim() || fallbackTitle,
          author: "",
          coverUrl: "",
          language: "",
          progress: 0,
          totalPages: 0,
          currentPage: 0,
          lastRead: new Date(),
          addedAt: new Date(),
          contentUrl,
        };

        addBook(newBook);
      } catch (err) {
        toast({
          title: "Nu am putut importa conținutul",
          description:
            "Fișierul nu a putut fi procesat. Te rugăm să încerci un alt EPUB sau PDF.",
          variant: "destructive",
        });
        setIsImporting(false);
        return;
      }

      toast({
        title: "Carte importată!",
        description: `"${file.name}" a fost adăugată în bibliotecă.`,
      });
      setIsImporting(false);
      setOpen(false);
    } else {
      toast({
        title: "Format nesuportat",
        description: "Te rugăm să încarci un fișier EPUB sau PDF.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className="gap-2 shadow-lg transition-all hover:scale-105 hover:shadow-xl"
          disabled={isImporting}
        >
          <Plus className="h-4 w-4" />
          {isImporting ? "Se importă..." : "Importă carte"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importă o carte nouă</DialogTitle>
          <DialogDescription>
            Încarcă un fișier EPUB sau PDF pentru a începe să citești și să
            înveți.
          </DialogDescription>
        </DialogHeader>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          className={`
            relative mt-4 flex min-h-[200px] cursor-pointer flex-col items-center justify-center
            rounded-xl border-2 border-dashed transition-all duration-200
            ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/50"
            }
          `}
        >
          <input
            type="file"
            accept=".epub,.pdf"
            onChange={handleFileInput}
            className="absolute inset-0 cursor-pointer opacity-0"
          />

          <div
            className={`
            mb-4 rounded-full p-4 transition-colors
            ${isDragging ? "bg-primary/10" : "bg-muted"}
          `}
          >
            <Upload
              className={`h-8 w-8 ${isDragging ? "text-primary" : "text-muted-foreground"}`}
            />
          </div>

          <p className="mb-2 text-sm font-medium">
            {isDragging
              ? "Eliberează pentru a încărca"
              : "Trage și plasează fișierul aici"}
          </p>
          <p className="text-xs text-muted-foreground">
            sau click pentru a selecta
          </p>

          <div className="mt-4 flex items-center gap-4">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-4 w-4" />
              EPUB
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <FileText className="h-4 w-4" />
              PDF
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
