
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Image as ImageIcon, CheckCircle2, Store } from "lucide-react";
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { toast } from '@/hooks/use-toast';

export default function StoreSettingsPage() {
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const db = useFirestore();
  const { user } = useUser();

  const staffRef = useMemoFirebase(() => user ? doc(db, 'staffUsers', user.uid) : null, [db, user]);
  const { data: profile } = useDoc(staffRef);

  const configRef = useMemoFirebase(() => doc(db, 'storeConfigs', 'settings'), [db]);
  const { data: config, isLoading: isConfigLoading } = useDoc(configRef);

  useEffect(() => {
    if (config?.bannerUrl) {
      setBannerUrl(config.bannerUrl);
      setLocalPreview(config.bannerUrl);
    }
  }, [config]);

  const isAdmin = profile?.role === 'Admin' || profile?.role === 'Superadmin' || user?.email === 'markken@gulayan.ph';

  const handleCloudinaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (localPreview && !localPreview.startsWith('http')) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    setIsUploading(true);

    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'firebase_upload');

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/dzytzdamb/image/upload`, {
        method: 'POST',
        body: uploadData
      });
      const data = await response.json();
      setBannerUrl(data.secure_url);
      toast({ title: "Image Uploaded", description: "The new banner is ready to be saved." });
    } catch (error) {
      toast({ title: "Upload Failed", description: "Could not upload image.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    try {
      setDocumentNonBlocking(configRef, {
        bannerUrl: bannerUrl,
        updatedAt: serverTimestamp(),
        updatedBy: user?.uid
      }, { merge: true });

      toast({ title: "Settings Saved", description: "The store banner has been updated." });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Store className="h-12 w-12 text-muted-foreground opacity-20 mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">Only administrators can change store settings.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-headline font-bold text-primary flex items-center gap-3">
          Store Settings <Store className="h-8 w-8" />
        </h1>
        <p className="text-muted-foreground">Configure global appearance and branding for GulayanFlow.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card className="border-none shadow-md overflow-hidden">
          <CardHeader>
            <CardTitle>Dashboard Banner</CardTitle>
            <CardDescription>This image will be displayed at the top of the main dashboard for all staff.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <Label>Current Banner Preview</Label>
              <div 
                className="relative h-64 w-full rounded-2xl border-2 border-dashed border-muted-foreground/20 bg-muted/30 flex items-center justify-center overflow-hidden group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                {localPreview ? (
                  <img src={localPreview} alt="Banner Preview" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                    <span className="text-sm text-muted-foreground">No banner set. Click to upload.</span>
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Upload className="h-10 w-10 text-white" />
                </div>

                {isUploading && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center backdrop-blur-sm">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleCloudinaryUpload} 
              />
              <p className="text-xs text-muted-foreground">Recommended size: 1200x400 pixels for best appearance.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-url">Banner Image URL</Label>
              <Input 
                id="banner-url" 
                value={bannerUrl} 
                readOnly 
                className="bg-muted cursor-not-allowed" 
                placeholder="Upload an image to see the URL here"
              />
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t p-6 flex justify-end">
            <Button 
              className="gap-2 px-8 h-11 shadow-lg shadow-primary/20" 
              onClick={handleSaveSettings}
              disabled={isSaving || isUploading || !bannerUrl}
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Save Store Branding
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
