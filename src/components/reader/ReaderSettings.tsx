import { Settings, Sun, Moon, Minus, Plus, Type, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import { supportedLanguages } from '@/data/languages';

export function ReaderSettings() {
  const { 
    readingSettings, 
    setReadingSettings, 
    isDarkMode, 
    setIsDarkMode,
    sourceLanguage,
    setSourceLanguage,
    targetLanguage,
    setTargetLanguage,
  } = useApp();

  const adjustFontSize = (delta: number) => {
    const newSize = Math.max(12, Math.min(32, readingSettings.fontSize + delta));
    setReadingSettings({ ...readingSettings, fontSize: newSize });
  };

  const adjustLineHeight = (value: number[]) => {
    setReadingSettings({ ...readingSettings, lineHeight: value[0] });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Setări lectură</SheetTitle>
        </SheetHeader>

        <div className="mt-8 space-y-8">
          {/* Language Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <label className="text-sm font-medium">Limbi</label>
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Limba cărții:</label>
                <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-xs text-muted-foreground">Traducere în:</label>
                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {supportedLanguages.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        <span className="flex items-center gap-2">
                          <span>{lang.flag}</span>
                          <span>{lang.name}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Theme Toggle */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Temă</label>
            <div className="flex gap-2">
              <Button
                variant={!isDarkMode ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setIsDarkMode(false)}
              >
                <Sun className="h-4 w-4" />
                Zi
              </Button>
              <Button
                variant={isDarkMode ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setIsDarkMode(true)}
              >
                <Moon className="h-4 w-4" />
                Noapte
              </Button>
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Mărime font</label>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustFontSize(-2)}
                disabled={readingSettings.fontSize <= 12}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="flex flex-1 items-center justify-center gap-2">
                <Type className="h-4 w-4 text-muted-foreground" />
                <span className="text-lg font-medium">{readingSettings.fontSize}px</span>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => adjustFontSize(2)}
                disabled={readingSettings.fontSize >= 32}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Line Height */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Spațiere rânduri</label>
              <span className="text-sm text-muted-foreground">{readingSettings.lineHeight.toFixed(1)}</span>
            </div>
            <Slider
              value={[readingSettings.lineHeight]}
              onValueChange={adjustLineHeight}
              min={1.2}
              max={2.5}
              step={0.1}
              className="py-2"
            />
          </div>

          {/* Font Family */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Font</label>
            <div className="flex gap-2">
              <Button
                variant={readingSettings.fontFamily === 'reading' ? 'default' : 'outline'}
                className="flex-1 font-reading"
                onClick={() => setReadingSettings({ ...readingSettings, fontFamily: 'reading' })}
              >
                Literata
              </Button>
              <Button
                variant={readingSettings.fontFamily === 'sans' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setReadingSettings({ ...readingSettings, fontFamily: 'sans' })}
              >
                Inter
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
