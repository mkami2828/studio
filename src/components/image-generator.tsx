
'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Download, Image as ImageIcon, LoaderCircle, Sparkles, Settings, Trash2, Dices, Copy, RotateCcw } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateImageAction, type ActionState } from '@/lib/actions';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import samplePrompts from '@/lib/prompts.json';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type HistoryItem = {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
};

const layouts = {
  'square': { width: 1080, height: 1080, name: 'Instagram Post (Square)' },
  'portrait': { width: 1080, height: 1350, name: 'Instagram Post (Portrait)' },
  'reel': { width: 1080, height: 1920, name: 'Instagram Reel/Story' },
  'fb_cover': { width: 851, height: 315, name: 'Facebook Cover' },
  'yt_thumbnail': { width: 1280, height: 720, name: 'YouTube Thumbnail' },
  'default': { width: 1024, height: 1024, name: 'Default (1024x1024)' },
};

type LayoutKey = keyof typeof layouts;

const models = ["flux", "kontext", "turbo", "gptimage"];

const defaultAdvancedSettings = {
    model: 'flux',
    enhance: false,
    nologo: false,
    private: false,
    safe: false
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <LoaderCircle className="animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
      Generate
    </Button>
  );
}

function ResultPanel({ 
  actionState,
  onNewImage, 
}: { 
  actionState: ActionState,
  onNewImage: (item: HistoryItem) => void,
}) {
  const { pending } = useFormStatus();
  const { toast } = useToast();
  
  const displayUrl = actionState.imageUrl;

  useEffect(() => {
    if (actionState.error) {
      toast({
        title: 'Generation Error',
        description: actionState.error,
        variant: 'destructive',
      });
    }
    if (actionState.imageUrl && actionState.prompt) {
        const newItem: HistoryItem = {
            id: `arty-ai-${Date.now()}`,
            prompt: actionState.prompt,
            imageUrl: actionState.imageUrl,
            timestamp: Date.now(),
          };
        onNewImage(newItem);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionState.imageUrl, actionState.error, actionState.prompt]);


  const handleCopyPrompt = () => {
    if (actionState.prompt) {
      navigator.clipboard.writeText(actionState.prompt);
      toast({
        title: 'Prompt Copied!',
        description: 'The prompt has been copied to your clipboard.',
      });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
          <div>
              <CardTitle>Result</CardTitle>
              <CardDescription>Your generated image will appear here.</CardDescription>
          </div>
          {displayUrl && !pending && (
            <div className="flex flex-col items-end gap-2">
              <Button type="button" variant="outline" size="sm" onClick={handleCopyPrompt} className="w-full"><Copy className="mr-2 h-4 w-4" /> Copy Prompt</Button>
              <Button asChild variant="outline" size="sm" className="w-full">
                <a href={`/api/download?url=${encodeURIComponent(displayUrl)}`}>
                  <Download className="mr-2 h-4 w-4" /> Download
                </a>
              </Button>
            </div>
          )}
      </CardHeader>
      <CardContent>
        <div className="aspect-square w-full rounded-lg border-2 border-dashed flex items-center justify-center bg-card-foreground/5 overflow-hidden">
          {pending ? (
            <div className="flex flex-col items-center justify-center gap-4 text-foreground p-8">
              <div className="relative h-24 w-24">
                  <div className="absolute inset-0 bg-primary/30 rounded-full animate-ping"></div>
                  <div className="relative flex items-center justify-center h-full w-full bg-primary/50 rounded-full">
                      <Sparkles className="h-12 w-12 text-primary-foreground animate-pulse" />
                  </div>
              </div>
              <p className="text-lg font-semibold tracking-wider">
                  Conjuring creativity...
              </p>
              <p className="text-sm text-muted-foreground">
                  Please wait while the AI works its magic.
              </p>
            </div>
          ) : displayUrl ? (
            <Image src={displayUrl} alt={actionState.prompt || "Generated image"} width={1024} height={1024} className="w-full h-full object-contain" data-ai-hint="abstract art" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <ImageIcon className="h-10 w-10" />
              <p>The magic happens here</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ImageGenerator() {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('text-to-image');
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [selectedLayout, setSelectedLayout] = useState<LayoutKey>('default');
    const [prompt, setPrompt] = useState('');
    const [advancedSettings, setAdvancedSettings] = useState(defaultAdvancedSettings);

    const [state, formAction] = useActionState(generateImageAction, {
        imageUrl: null,
        error: null,
        prompt: null,
    });
    
    useEffect(() => {
      try {
        const storedHistory = localStorage.getItem('arty-ai-history');
        if (storedHistory) {
          setHistory(JSON.parse(storedHistory));
        }
      } catch (error) {
          console.error("Failed to load history from localStorage", error);
      }
    }, []);
  
    const handleNewImage = (newItem: HistoryItem) => {
      setPrompt(newItem.prompt); // update prompt in textarea
      setHistory(prevHistory => {
          const newHistory = [newItem, ...prevHistory];
          try {
              localStorage.setItem('arty-ai-history', JSON.stringify(newHistory));
          } catch (error) {
              console.error("Failed to save history to localStorage", error);
          }
          return newHistory;
      });
    };
  
    const handleCopyHistoryPrompt = (prompt: string) => {
      navigator.clipboard.writeText(prompt);
      toast({
        title: 'Prompt Copied!',
        description: 'The prompt has been copied to your clipboard.',
      });
    };
  
    const handleClearHistory = () => {
      setHistory([]);
      try {
        localStorage.removeItem('arty-ai-history');
        toast({ title: 'History Cleared', description: 'Your image generation history has been removed.' });
      } catch (error) {
        console.error("Failed to clear history from localStorage", error);
      }
    };
  
    const handleDeleteHistoryItem = (idToDelete: string) => {
      setHistory(prevHistory => {
        const updatedHistory = prevHistory.filter(item => item.id !== idToDelete);
        try {
          localStorage.setItem('arty-ai-history', JSON.stringify(updatedHistory));
          toast({ title: 'Image Deleted', description: 'The image has been removed from your history.' });
        } catch (error)
        {
          console.error("Failed to update history in localStorage", error);
          toast({ title: 'Error', description: 'Could not delete the image from history.', variant: 'destructive' });
        }
        return updatedHistory;
      });
    };
  
    const handleRandomPrompt = () => {
      const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
      setPrompt(randomPrompt);
    };
  
    const handleResetAdvanced = () => {
      setAdvancedSettings(defaultAdvancedSettings);
      toast({ title: 'Advanced settings reset' });
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <form action={formAction}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className={cn("lg:col-span-1", activeTab === 'history' && 'lg:col-span-3')}>
                        <Card>
                            <CardHeader>
                                <CardTitle>Image Generation</CardTitle>
                                <CardDescription>Create new images or view your history.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="grid w-full grid-cols-2">
                                        <TabsTrigger value="text-to-image">Text-to-Image</TabsTrigger>
                                        <TabsTrigger value="history">History</TabsTrigger>
                                    </TabsList>
                                    <TabsContent value="text-to-image" className="mt-4">
                                        <div className="space-y-4">
                                            <input type="hidden" name="mode" value="text-to-image" />
                                            <input type="hidden" name="width" value={layouts[selectedLayout].width} />
                                            <input type="hidden" name="height" value={layouts[selectedLayout].height} />

                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center">
                                                    <Label htmlFor="prompt-text">Prompt</Label>
                                                    <Button type="button" variant="ghost" size="sm" onClick={handleRandomPrompt}>
                                                        <Dices className="mr-2 h-4 w-4" />
                                                        Random
                                                    </Button>
                                                </div>
                                                <Textarea id="prompt-text" name="prompt" placeholder="e.g., A beautiful sunset over the ocean" required value={prompt} onChange={(e) => setPrompt(e.target.value)} />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor="layout">Layout</Label>
                                                <Select onValueChange={(value: LayoutKey) => setSelectedLayout(value)} defaultValue={selectedLayout}>
                                                    <SelectTrigger id="layout">
                                                        <SelectValue placeholder="Select a layout" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {Object.entries(layouts).map(([key, { name, width, height }]) => (
                                                            <SelectItem key={key} value={key}>{name} ({width}x{height})</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <Label htmlFor="seed">Seed</Label>
                                                <Input id="seed" name="seed" type="number" placeholder="A random seed will be used" />
                                            </div>
                                            
                                            <Accordion type="single" collapsible>
                                                <AccordionItem value="advanced-settings">
                                                    <AccordionTrigger>
                                                        <div className="flex items-center gap-2">
                                                            <Settings className="h-4 w-4" />
                                                            Advanced Settings
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="space-y-4 pt-4">
                                                        <div className="flex justify-end">
                                                            <Button type="button" variant="ghost" size="sm" onClick={handleResetAdvanced}>
                                                                <RotateCcw className="mr-2 h-4 w-4" />
                                                                Reset
                                                            </Button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label htmlFor="model-select">Model</Label>
                                                            <Select name="model" value={advancedSettings.model} onValueChange={(value) => setAdvancedSettings(s => ({...s, model: value}))}>
                                                                <SelectTrigger id="model-select">
                                                                    <SelectValue placeholder="Select a model" />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    {models.map((model) => (
                                                                        <SelectItem key={model} value={model}>{model}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                                            <Label htmlFor="enhance" className="flex flex-col space-y-1">
                                                                <span>Enhance Prompt</span>
                                                                <span className="font-normal leading-snug text-muted-foreground text-xs">Let an LLM enhance your prompt for more detail.</span>
                                                            </Label>
                                                            <Switch id="enhance" name="enhance" checked={advancedSettings.enhance} onCheckedChange={(checked) => setAdvancedSettings(s => ({...s, enhance: checked}))} />
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                                            <Label htmlFor="nologo" className="flex flex-col space-y-1">
                                                                <span>No Logo</span>
                                                                <span className="font-normal leading-snug text-muted-foreground text-xs">Disable the Pollinations logo overlay.</span>
                                                            </Label>
                                                            <Switch id="nologo" name="nologo" checked={advancedSettings.nologo} onCheckedChange={(checked) => setAdvancedSettings(s => ({...s, nologo: checked}))} />
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                                            <Label htmlFor="private" className="flex flex-col space-y-1">
                                                                <span>Private</span>
                                                                <span className="font-normal leading-snug text-muted-foreground text-xs">Prevent image from appearing in public feed.</span>
                                                            </Label>
                                                            <Switch id="private" name="private" checked={advancedSettings.private} onCheckedChange={(checked) => setAdvancedSettings(s => ({...s, private: checked}))} />
                                                        </div>
                                                        <div className="flex items-center justify-between rounded-lg border p-3">
                                                            <Label htmlFor="safe" className="flex flex-col space-y-1">
                                                                <span>Safe Mode</span>
                                                                <span className="font-normal leading-snug text-muted-foreground text-xs">Strict NSFW filtering (throws error if detected).</span>
                                                            </Label>
                                                            <Switch id="safe" name="safe" checked={advancedSettings.safe} onCheckedChange={(checked) => setAdvancedSettings(s => ({...s, safe: checked}))} />
                                                        </div>
                                                    </AccordionContent>
                                                </AccordionItem>
                                            </Accordion>

                                            <SubmitButton />
                                        </div>
                                    </TabsContent>
                                    <TabsContent value="history" className="mt-4">
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-muted-foreground">Your past generations.</p>
                                                {history.length > 0 && (
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button type="button" variant="outline" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Clear All</Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent>
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    This will permanently delete your entire generation history. This action cannot be undone.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                <AlertDialogAction onClick={handleClearHistory}>Continue</AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                )}
                                            </div>
                                            <ScrollArea className="h-96 w-full rounded-md border">
                                                {history.length === 0 ? (
                                                    <div className="flex h-full items-center justify-center">
                                                        <p className="text-center text-muted-foreground py-16">No history yet. Generate an image to get started!</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
                                                        {history.map(item => {
                                                            const downloadUrl = `/api/download?url=${encodeURIComponent(item.imageUrl)}`;
                                                            return (
                                                                <Card key={item.id} className="overflow-hidden flex flex-col">
                                                                    <div className="aspect-square w-full bg-card-foreground/5 relative">
                                                                        <Image src={item.imageUrl} alt={item.prompt} fill className="object-contain" data-ai-hint="gallery photo" />
                                                                    </div>
                                                                    <CardContent className="p-2 flex-grow">
                                                                        <p className="text-xs text-muted-foreground line-clamp-2">{item.prompt}</p>
                                                                    </CardContent>
                                                                    <CardFooter className="p-2 pt-0">
                                                                        <div className="flex flex-col w-full items-stretch gap-2">
                                                                            <Button type="button" variant="secondary" size="sm" className="h-7 px-2 text-xs" onClick={() => handleCopyHistoryPrompt(item.prompt)}>
                                                                                <Copy className="mr-1 h-3 w-3" /> Copy Prompt
                                                                            </Button>
                                                                            <Button asChild variant="secondary" size="sm" className="h-7 px-2 text-xs">
                                                                                <a href={downloadUrl}>
                                                                                    <Download className="mr-1 h-3 w-3" /> Download
                                                                                </a>
                                                                            </Button>
                                                                            <AlertDialog>
                                                                                <AlertDialogTrigger asChild>
                                                                                    <Button type="button" variant="destructive" size="sm" className="h-7 px-2 text-xs">
                                                                                        <Trash2 className="mr-1 h-3 w-3" /> Delete
                                                                                    </Button>
                                                                                </AlertDialogTrigger>
                                                                                <AlertDialogContent>
                                                                                    <AlertDialogHeader>
                                                                                        <AlertDialogTitle>Delete Image?</AlertDialogTitle>
                                                                                        <AlertDialogDescription>
                                                                                            This will permanently delete this image from your history. This action cannot be undone.
                                                                                        </AlertDialogDescription>
                                                                                    </AlertDialogHeader>
                                                                                    <AlertDialogFooter>
                                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                                        <AlertDialogAction onClick={() => handleDeleteHistoryItem(item.id)}>Delete</AlertDialogAction>
                                                                                    </AlertDialogFooter>
                                                                                </AlertDialogContent>
                                                                            </AlertDialog>
                                                                        </div>
                                                                    </CardFooter>
                                                                </Card>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </ScrollArea>
                                        </div>
                                    </TabsContent>
                                </Tabs>
                            </CardContent>
                        </Card>
                    </div>
                    <div className={cn("lg:col-span-2", activeTab === 'history' && 'hidden')}>
                        <ResultPanel actionState={state} onNewImage={handleNewImage} />
                    </div>
                </div>
            </form>
        </div>
    );
}
