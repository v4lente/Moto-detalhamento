import React, { useState, useEffect } from "react";
import { TabsContent } from "@/shared/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { ImageUpload } from "@/shared/components/ImageUpload";
import { useSettings, useSettingsMutation } from "../hooks/use-admin";
import type { UpdateSiteSettings } from "@shared/contracts";
import { Loader2 } from "lucide-react";

export function SettingsPage() {
  const [logoImage, setLogoImage] = useState("");
  const [backgroundImage, setBackgroundImage] = useState("");

  const { data: settings, isLoading: settingsLoading } = useSettings();
  const updateSettingsMutation = useSettingsMutation();

  useEffect(() => {
    if (settings) {
      setLogoImage(settings.logoImage || "");
      setBackgroundImage(settings.backgroundImage || "");
    }
  }, [settings]);

  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const settingsData: UpdateSiteSettings = {
      whatsappNumber: formData.get("whatsappNumber") as string,
      siteName: formData.get("siteName") as string,
      siteTagline: formData.get("siteTagline") as string,
      heroTitle: formData.get("heroTitle") as string,
      heroTitleLine2: formData.get("heroTitleLine2") as string || undefined,
      heroSubtitle: formData.get("heroSubtitle") as string,
      footerText: formData.get("footerText") as string,
      copyrightText: formData.get("copyrightText") as string,
      logoImage: logoImage,
      backgroundImage: backgroundImage,
      businessAddress: formData.get("businessAddress") as string,
      instagramUrl: formData.get("instagramUrl") as string,
      facebookUrl: formData.get("facebookUrl") as string,
      youtubeUrl: formData.get("youtubeUrl") as string,
    };
    updateSettingsMutation.mutate(settingsData);
  };

  return (
    <TabsContent value="settings">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-display">Configurações do Site</CardTitle>
          <CardDescription>Personalize as informações exibidas no site</CardDescription>
        </CardHeader>
        <CardContent>
          {settingsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <form onSubmit={handleSettingsSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="whatsappNumber">Número do WhatsApp</Label>
                  <Input id="whatsappNumber" name="whatsappNumber" defaultValue={settings?.whatsappNumber} placeholder="5511999999999" data-testid="input-whatsapp" />
                  <p className="text-xs text-muted-foreground">Formato: 55 + DDD + Número (sem espaços)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteName">Nome do Site</Label>
                  <Input id="siteName" name="siteName" defaultValue={settings?.siteName} data-testid="input-site-name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="siteTagline">Slogan</Label>
                  <Input id="siteTagline" name="siteTagline" defaultValue={settings?.siteTagline} data-testid="input-tagline" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="heroTitle">Título (Linha 1)</Label>
                  <Input id="heroTitle" name="heroTitle" defaultValue={settings?.heroTitle} placeholder="Ex: Estética" data-testid="input-hero-title" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="heroTitleLine2">Título (Linha 2)</Label>
                <Input id="heroTitleLine2" name="heroTitleLine2" defaultValue={settings?.heroTitleLine2 || ""} placeholder="Ex: Premium" data-testid="input-hero-title-line2" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="heroSubtitle">Subtítulo</Label>
                <Textarea id="heroSubtitle" name="heroSubtitle" defaultValue={settings?.heroSubtitle} data-testid="input-hero-subtitle" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="footerText">Texto do Rodapé</Label>
                <Textarea id="footerText" name="footerText" defaultValue={settings?.footerText} data-testid="input-footer-text" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="copyrightText">Texto de Copyright</Label>
                <Input id="copyrightText" name="copyrightText" defaultValue={settings?.copyrightText} data-testid="input-copyright" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="businessAddress">Endereço do Estabelecimento</Label>
                <Input id="businessAddress" name="businessAddress" defaultValue={settings?.businessAddress || ""} placeholder="Rua, Número - Bairro, Cidade - Estado" data-testid="input-business-address" />
                <p className="text-xs text-muted-foreground">Este endereço será exibido no rodapé com um botão "Como Chegar"</p>
              </div>
              
              <div className="space-y-4">
                <Label className="text-base font-semibold">Redes Sociais</Label>
                <p className="text-xs text-muted-foreground -mt-2">Links das redes sociais que serão exibidos no rodapé</p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instagramUrl">Instagram</Label>
                    <Input id="instagramUrl" name="instagramUrl" defaultValue={settings?.instagramUrl || ""} placeholder="https://instagram.com/seu_perfil" data-testid="input-instagram" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="facebookUrl">Facebook</Label>
                    <Input id="facebookUrl" name="facebookUrl" defaultValue={settings?.facebookUrl || ""} placeholder="https://facebook.com/sua_pagina" data-testid="input-facebook" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="youtubeUrl">YouTube</Label>
                    <Input id="youtubeUrl" name="youtubeUrl" defaultValue={settings?.youtubeUrl || ""} placeholder="https://youtube.com/@seu_canal" data-testid="input-youtube" />
                  </div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Logo</Label>
                  <ImageUpload value={logoImage} onChange={setLogoImage} />
                </div>
                <div className="space-y-2">
                  <Label>Imagem de Fundo</Label>
                  <ImageUpload value={backgroundImage} onChange={setBackgroundImage} />
                </div>
              </div>
              <Button type="submit" className="bg-primary text-black hover:bg-primary/90 font-bold" data-testid="button-save-settings">
                Salvar Configurações
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}

export default SettingsPage;
