'use client';

import { useEffect, useState, useRef, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import Image from 'next/image';
import { Download, Image as ImageIcon, LoaderCircle, Sparkles, Settings } from 'lucide-react';

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
  const initialState: ActionState = { imageUrl: null, error: null };
  const [state, dispatch] = useActionState(generateImageAction, initialState);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('text-to-image');
  const [displayedImageUrl, setDisplayedImageUrl] = useState<string | null>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  
  const formRefText = useRef<HTMLFormElement>(null);
  const formRefTransparent = useRef<HTMLFormElement>(null);
  const formRefImage = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.error) {
      toast({
        title: 'Generation Error',
        description: state.error,
        variant: 'destructive',
      });
    }
    if (state.imageUrl) {
        setDisplayedImageUrl(state.imageUrl);
    }
  }, [state, toast]);

  const handleDownload = async () => {
    if (!displayedImageUrl) return;
    try {
      toast({ title: 'Starting download...', description: 'Your image will be downloaded shortly.' });
      const response = await fetch(displayedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileExtension = blob.type.split('/')[1] || 'png';
      a.download = `imageforge-ai-${Date.now()}.${fileExtension}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: 'Download Failed',
        description: 'Could not download the image.',
        variant: 'destructive',
      });
    }
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        setImageDataUrl(result);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Image Generation</CardTitle>
              <CardDescription>Select a mode and enter your prompt to generate an image.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text-to-image">Text-to-Image</TabsTrigger>
                  <TabsTrigger value="transparent-bg">Transparent</TabsTrigger>
                </TabsList>
                <TabsContent value="text-to-image" className="mt-4">
                  <form ref={formRefText} action={dispatch} className="space-y-4">
                    <input type="hidden" name="mode" value="text-to-image" />
                    <div className="space-y-2">
                      <Label htmlFor="prompt-text">Prompt</Label>
                      <Textarea id="prompt-text" name="prompt" placeholder="e.g., A beautiful sunset over the ocean" required />
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
                <TabsContent value="transparent-bg" className="mt-4">
                   <form ref={formRefTransparent} action={dispatch} className="space-y-4">
                    <input type="hidden" name="mode" value="transparent-bg" />
                    <div className="space-y-2">
                      <Label htmlFor="prompt-transparent">Prompt</Label>
                      <Textarea id="prompt-transparent" name="prompt" placeholder="e.g., A company logo for 'ImageForge'" required />
                    </div>
                     <p className="text-xs text-muted-foreground">Generates an image with a transparent background using the 'gptimage' model.</p>
                    <SubmitButton>Generate Transparent</SubmitButton>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-2">
          <Card className="h-full">
             <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Result</CardTitle>
                    <CardDescription>Your generated image will appear here.</CardDescription>
                </div>
                 {displayedImageUrl && <Button variant="outline" size="sm" onClick={handleDownload}><Download className="mr-2 h-4 w-4" /> Download</Button>}
            </CardHeader>
            <CardContent>
              <div className="aspect-square w-full rounded-lg border-2 border-dashed flex items-center justify-center bg-card-foreground/5 overflow-hidden">
                {useFormStatus().pending ? (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <LoaderCircle className="h-10 w-10 animate-spin" />
                    <p>Generating your masterpiece...</p>
                  </div>
                ) : displayedImageUrl ? (
                  <Image src={displayedImageUrl} alt="Generated image" width={1024} height={1024} className="w-full h-full object-contain" data-ai-hint="abstract art" />
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
      </div>
    </div>
  );
}
