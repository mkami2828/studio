'use client';

import { useEffect, useState, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Download, Image as ImageIcon, LoaderCircle, Sparkles, Settings, Trash2, Dices } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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

type HistoryItem = {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <LoaderCircle className="animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
      {children}
    </Button>
  );
}

export default function ImageGenerator() {
  const formRef = useRef<HTMLFormElement>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const initialState: ActionState = { imageUrl: null, error: null, prompt: null };
  const [state, dispatch] = useActionState(generateImageAction, initialState);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('text-to-image');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);

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

  useEffect(() => {
    if (state.error) {
      toast({
        title: 'Generation Error',
        description: state.error,
        variant: 'destructive',
      });
    }
    if (state.imageUrl && state.prompt) {
      const newImageUrl = state.imageUrl.startsWith('data:') ? state.imageUrl : `${state.imageUrl}&t=${new Date().getTime()}`;
      setImageUrl(newImageUrl);

      const newItem: HistoryItem = {
        id: `arty-ai-${Date.now()}`,
        prompt: state.prompt,
        imageUrl: newImageUrl,
        timestamp: Date.now(),
      };

      setHistory(prevHistory => {
        const updatedHistory = [newItem, ...prevHistory];
        try {
          localStorage.setItem('arty-ai-history', JSON.stringify(updatedHistory));
        } catch (error) {
          console.error("Failed to save history to localStorage", error);
        }
        return updatedHistory;
      });
      // Don't reset the form
      // formRef.current?.reset();
    }
  }, [state, toast]);
  
  const handleDownload = async (url: string) => {
    if (!url) return;
    try {
      toast({ title: 'Starting download...', description: 'Your image will be downloaded shortly.' });
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      const fileExtension = blob.type.split('/')[1] || 'png';
      a.download = `arty-ai-${Date.now()}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download the image.',
        variant: 'destructive',
      });
    }
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

  const handleRandomPrompt = () => {
    if (promptRef.current) {
      const randomPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
      promptRef.current.value = randomPrompt;
      // Manually trigger a change event if needed by other hooks, though setting value directly is often enough
      promptRef.current.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
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
                  <form ref={formRef} action={dispatch} className="space-y-4">
                    <input type="hidden" name="mode" value="text-to-image" />
                    <div className="space-y-2">
                       <div className="flex justify-between items-center">
                        <Label htmlFor="prompt-text">Prompt</Label>
                        <Button type="button" variant="ghost" size="sm" onClick={handleRandomPrompt}>
                          <Dices className="mr-2 h-4 w-4" />
                          Random
                        </Button>
                      </div>
                      <Textarea id="prompt-text" name="prompt" ref={promptRef} placeholder="e.g., A beautiful sunset over the ocean" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="width">Width</Label>
                        <Input id="width" name="width" type="number" placeholder="1024" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="height">Height</Label>
                        <Input id="height" name="height" type="number" placeholder="1024" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="seed">Seed</Label>
                      <Input id="seed" name="seed" type="number" placeholder="42" />
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
                          <div className="space-y-2">
                            <Label htmlFor="model">Model</Label>
                            <Input id="model" name="model" type="text" placeholder="flux" />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="enhance" className="flex flex-col space-y-1">
                              <span>Enhance Prompt</span>
                              <span className="font-normal leading-snug text-muted-foreground text-xs">Let an LLM enhance your prompt for more detail.</span>
                            </Label>
                            <Switch id="enhance" name="enhance" />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="nologo" className="flex flex-col space-y-1">
                              <span>No Logo</span>
                              <span className="font-normal leading-snug text-muted-foreground text-xs">Disable the Pollinations logo overlay.</span>
                            </Label>
                            <Switch id="nologo" name="nologo" />
                          </div>
                           <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="private" className="flex flex-col space-y-1">
                              <span>Private</span>
                              <span className="font-normal leading-snug text-muted-foreground text-xs">Prevent image from appearing in public feed.</span>
                            </Label>
                            <Switch id="private" name="private" />
                          </div>
                          <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="safe" className="flex flex-col space-y-1">
                              <span>Safe Mode</span>
                              <span className="font-normal leading-snug text-muted-foreground text-xs">Strict NSFW filtering (throws error if detected).</span>
                            </Label>
                            <Switch id="safe" name="safe" />
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>

                    <SubmitButton>Generate</SubmitButton>
                  </form>
                </TabsContent>
                <TabsContent value="history" className="mt-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">Your past generations.</p>
                      {history.length > 0 && (
                         <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Clear</Button>
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
                            {history.map(item => (
                              <Card key={item.id} className="overflow-hidden group">
                                <div className="aspect-square w-full bg-card-foreground/5 relative">
                                  <Image src={item.imageUrl} alt={item.prompt} layout="fill" className="object-contain" data-ai-hint="gallery photo" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                                    <p className="text-xs text-primary-foreground line-clamp-4 mb-2">{item.prompt}</p>
                                    <Button variant="secondary" size="sm" className="h-8" onClick={() => handleDownload(item.imageUrl)}>
                                      <Download className="mr-2 h-4 w-4" /> Download
                                    </Button>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        {activeTab === 'text-to-image' && (
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                      <CardTitle>Result</CardTitle>
                      <CardDescription>Your generated image will appear here.</CardDescription>
                  </div>
                  {imageUrl && <Button variant="outline" size="sm" onClick={() => handleDownload(imageUrl)}><Download className="mr-2 h-4 w-4" /> Download</Button>}
              </CardHeader>
              <CardContent>
                <div className="aspect-square w-full rounded-lg border-2 border-dashed flex items-center justify-center bg-card-foreground/5 overflow-hidden">
                  {useFormStatus().pending ? (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <LoaderCircle className="h-10 w-10 animate-spin" />
                      <p>Generating your masterpiece...</p>
                    </div>
                  ) : imageUrl ? (
                    <Image src={imageUrl} alt={state.prompt || "Generated image"} width={1024} height={1024} className="w-full h-full object-contain" data-ai-hint="abstract art" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <ImageIcon className="h-10 w-10" />
                      <p>The magic happens here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
