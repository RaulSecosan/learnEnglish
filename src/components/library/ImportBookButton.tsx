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
const PAGE_BREAK_MARKER = "\n\n<<<PAGE_BREAK>>>\n\n";

interface EpubMetadata {
  title?: string;
  titles?: string[];
}

interface EpubPackage {
  metadata?: EpubMetadata;
}

interface EpubSection {
  href?: string;
  url?: string;
  canonical?: string;
  load?: (loader: (...args: unknown[]) => unknown) => Promise<Document>;
  render?: (loader: (...args: unknown[]) => unknown) => Promise<string>;
  unload?: () => void;
}

interface EpubTocItem {
  href?: string;
  subitems?: EpubTocItem[];
}

interface EpubBookShape {
  ready?: Promise<unknown>;
  load?: (...args: unknown[]) => unknown;
  destroy?: () => void;
  package?: EpubPackage;
  navigation?: {
    toc?: EpubTocItem[];
  };
  spine?: {
    spineItems?: EpubSection[];
    items?: EpubSection[];
  };
}

interface PdfTextItem {
  str?: string;
  transform?: number[];
  width?: number;
}

interface PdfMetadataInfo {
  Title?: string;
}

interface PdfMetadataShape {
  info?: PdfMetadataInfo;
}

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
    const rawBook = ePub(arrayBuffer) as unknown;
    const book = rawBook as EpubBookShape;
    await book.ready;

    const normalizeText = (text: string) =>
      text.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    const loadResource =
      typeof book.load === "function" ? book.load.bind(book) : undefined;

    const spineItems = book.spine?.spineItems ?? book.spine?.items ?? [];
    const sectionChunksBySpineIndex: string[] = new Array(spineItems.length).fill("");

    const normalizeHref = (value: string) => {
      const withoutHash = value.split("#")[0] ?? "";
      const withoutQuery = withoutHash.split("?")[0] ?? "";
      const normalizedSlashes = withoutQuery.replace(/\\/g, "/");
      return decodeURIComponent(normalizedSlashes).trim().toLowerCase();
    };

    for (let sectionIndex = 0; sectionIndex < spineItems.length; sectionIndex += 1) {
      const item = spineItems[sectionIndex];
      let sectionText = "";

      try {
        if (loadResource && typeof item.load === "function") {
          const doc = await item.load(loadResource);
          sectionText = doc?.body?.textContent ?? "";
        }
      } catch {
        // Fallback below for EPUBs where section load fails.
      }

      if (!sectionText.trim()) {
        try {
          if (loadResource && typeof item.render === "function") {
            const html = await item.render(loadResource);
            if (html.trim()) {
              const parsed = new DOMParser().parseFromString(html, "text/html");
              sectionText = parsed.body?.textContent ?? "";
            }
          }
        } catch {
          // Ignore individual section failures; continue with other sections.
        }
      }

      const cleaned = normalizeText(sectionText);
      if (cleaned) {
        sectionChunksBySpineIndex[sectionIndex] = cleaned;
      }

      item.unload?.();
    }

    const hrefToSpineIndex = new Map<string, number>();
    spineItems.forEach((item, index) => {
      const candidates = [item.href, item.url, item.canonical]
        .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
        .map(normalizeHref);
      for (const candidate of candidates) {
        if (!hrefToSpineIndex.has(candidate)) {
          hrefToSpineIndex.set(candidate, index);
        }
      }
    });

    const flattenTocHrefs = (items: EpubTocItem[]): string[] => {
      const hrefs: string[] = [];
      for (const item of items) {
        if (typeof item.href === "string" && item.href.trim()) {
          hrefs.push(normalizeHref(item.href));
        }
        if (Array.isArray(item.subitems) && item.subitems.length > 0) {
          hrefs.push(...flattenTocHrefs(item.subitems));
        }
      }
      return hrefs;
    };

    const tocHrefs = flattenTocHrefs(book.navigation?.toc ?? []);
    const chapterStarts = tocHrefs
      .map((href) => hrefToSpineIndex.get(href))
      .filter((index): index is number => typeof index === "number")
      .filter((index, pos, arr) => arr.indexOf(index) === pos)
      .sort((a, b) => a - b);

    const chapterChunks: string[] = [];
    if (chapterStarts.length > 0 && sectionChunksBySpineIndex.length > 0) {
      const boundaries = [0, ...chapterStarts]
        .filter((index, pos, arr) => arr.indexOf(index) === pos)
        .sort((a, b) => a - b);
      boundaries.push(sectionChunksBySpineIndex.length);

      for (let i = 0; i < boundaries.length - 1; i += 1) {
        const start = boundaries[i];
        const endExclusive = boundaries[i + 1];
        const chapterText = sectionChunksBySpineIndex
          .slice(start, endExclusive)
          .filter(Boolean)
          .join("\n\n")
          .trim();
        if (chapterText) {
          chapterChunks.push(chapterText);
        }
      }
    }

    const baseChunks =
      chapterChunks.length > 0
        ? chapterChunks
        : sectionChunksBySpineIndex.filter(Boolean);
    const finalChunks = baseChunks;

    const metadataTitle = book.package?.metadata?.title || book.package?.metadata?.titles?.[0];
    book.destroy?.();

    return {
      content: finalChunks.join(PAGE_BREAK_MARKER),
      title: typeof metadataTitle === "string" ? metadataTitle : undefined,
      totalPages: Math.max(finalChunks.length, 1),
    };
  };

  const extractPdfText = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const pageChunks: string[] = [];

    const extractPageText = (items: PdfTextItem[]) => {
      const positionedItems = items
        .filter((item) => "str" in item && typeof item.str === "string")
        .map((item) => ({
          str: item.str as string,
          x: Array.isArray(item.transform) ? Number(item.transform[4] ?? 0) : 0,
          y: Array.isArray(item.transform) ? Number(item.transform[5] ?? 0) : 0,
          width: typeof item.width === "number" ? item.width : 0,
        }))
        .filter((item) => item.str.trim().length > 0);

      positionedItems.sort((a, b) => {
        const yDiff = b.y - a.y;
        if (Math.abs(yDiff) > 2) {
          return yDiff;
        }
        return a.x - b.x;
      });

      type Line = { y: number; items: typeof positionedItems };
      const lines: Line[] = [];

      for (const item of positionedItems) {
        const lastLine = lines[lines.length - 1];
        if (!lastLine || Math.abs(lastLine.y - item.y) > 2) {
          lines.push({ y: item.y, items: [item] });
        } else {
          lastLine.items.push(item);
        }
      }

      return lines
        .map((line) => {
          const sortedLineItems = [...line.items].sort((a, b) => a.x - b.x);
          let lineText = "";

          for (let i = 0; i < sortedLineItems.length; i += 1) {
            const current = sortedLineItems[i];
            const prev = sortedLineItems[i - 1];
            if (!current.str.trim()) {
              continue;
            }

            if (!prev) {
              lineText = current.str.trim();
              continue;
            }

            const prevEndX = prev.x + prev.width;
            const gap = current.x - prevEndX;
            const separator = gap > 1.5 ? " " : "";
            lineText += `${separator}${current.str.trim()}`;
          }

          return lineText.trim();
        })
        .filter(Boolean)
        .join("\n");
    };

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = extractPageText(textContent.items as PdfTextItem[]);
      if (pageText) {
        pageChunks.push(pageText);
      }
    }

    let metadataTitle: string | undefined;
    try {
      const metadata = (await pdf.getMetadata()) as PdfMetadataShape;
      const title = metadata?.info?.Title;
      if (typeof title === "string" && title.trim()) {
        metadataTitle = title.trim();
      }
    } catch {
      // ignore metadata errors
    }

    return {
      content: pageChunks.join(PAGE_BREAK_MARKER),
      title: metadataTitle,
      totalPages: pageChunks.length || pdf.numPages,
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
    const contentUrl = await getDownloadURL(contentRef);
    return { contentUrl, contentPath: storagePath };
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

        const { content, title: extractedTitle, totalPages } =
          extension === "epub"
            ? await extractEpubText(file)
            : await extractPdfText(file);

        if (!content.trim()) {
          throw new Error("empty-content");
        }

        const bookId = generateId();
        const { contentUrl, contentPath } = await uploadBookContent(
          bookId,
          content,
        );

        // create a minimal Book metadata object and add to app state
        const fallbackTitle = file.name.replace(/\.[^/.]+$/, "");
        const newBook = {
          id: bookId,
          title: extractedTitle?.trim() || fallbackTitle,
          format: extension === "epub" ? "epub" : "pdf",
          author: "",
          coverUrl: "",
          language: "",
          progress: 0,
          totalPages: typeof totalPages === "number" ? totalPages : 1,
          currentPage: 1,
          lastRead: new Date(),
          addedAt: new Date(),
          contentUrl,
          contentPath,
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
