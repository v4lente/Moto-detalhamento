import React, { useState } from "react";
import { TabsContent } from "@/shared/ui/tabs";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { ImageUpload } from "@/shared/components/ImageUpload";
import { useServicePosts, useServicePostMutations } from "../hooks/use-admin";
import type { ServicePostWithMedia } from "@shared/contracts";
import { 
  Plus, Pencil, Trash2, Loader2, Camera, Play, Image, X 
} from "lucide-react";

export function GalleryManagementPage() {
  const [editingServicePost, setEditingServicePost] = useState<ServicePostWithMedia | null>(null);
  const [isServicePostDialogOpen, setIsServicePostDialogOpen] = useState(false);
  const [serviceMediaUrls, setServiceMediaUrls] = useState<string[]>([]);
  const [serviceMediaTypes, setServiceMediaTypes] = useState<string[]>([]);

  const { data: servicePosts, isLoading: servicePostsLoading } = useServicePosts();
  const { createServicePostMutation, updateServicePostMutation, deleteServicePostMutation } = useServicePostMutations();

  const handleAddServiceMedia = (url: string, type: "image" | "video") => {
    setServiceMediaUrls([...serviceMediaUrls, url]);
    setServiceMediaTypes([...serviceMediaTypes, type]);
  };

  const handleRemoveServiceMedia = (index: number) => {
    setServiceMediaUrls(serviceMediaUrls.filter((_, i) => i !== index));
    setServiceMediaTypes(serviceMediaTypes.filter((_, i) => i !== index));
  };

  return (
    <TabsContent value="services" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Galeria de Serviços</h2>
        <Dialog open={isServicePostDialogOpen} onOpenChange={(open) => {
          setIsServicePostDialogOpen(open);
          if (!open) {
            setEditingServicePost(null);
            setServiceMediaUrls([]);
            setServiceMediaTypes([]);
          }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-black hover:bg-primary/90" data-testid="button-add-service">
              <Plus className="h-4 w-4 mr-2" /> Novo Serviço
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingServicePost ? "Editar Serviço" : "Adicionar Serviço"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const postData = {
                  title: formData.get("title") as string,
                  description: formData.get("description") as string || null,
                  clientName: formData.get("clientName") as string || null,
                  vehicleInfo: formData.get("vehicleInfo") as string || null,
                  mediaUrls: serviceMediaUrls,
                  mediaTypes: serviceMediaTypes,
                  featured: formData.get("featured") === "on",
                };

                if (editingServicePost) {
                  updateServicePostMutation.mutate({
                    id: editingServicePost.id,
                    data: postData,
                  }, {
                    onSuccess: () => {
                      setEditingServicePost(null);
                      setIsServicePostDialogOpen(false);
                      setServiceMediaUrls([]);
                      setServiceMediaTypes([]);
                    }
                  });
                } else {
                  createServicePostMutation.mutate(postData, {
                    onSuccess: () => {
                      setIsServicePostDialogOpen(false);
                      setServiceMediaUrls([]);
                      setServiceMediaTypes([]);
                    }
                  });
                }
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="title">Título do Serviço *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={editingServicePost?.title || ""}
                  placeholder="Ex: Detalhamento Completo BMW R1250GS"
                  required
                  className="bg-background"
                  data-testid="input-service-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingServicePost?.description || ""}
                  placeholder="Descreva o serviço realizado..."
                  className="bg-background min-h-[100px]"
                  data-testid="input-service-description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientName">Nome do Cliente</Label>
                  <Input
                    id="clientName"
                    name="clientName"
                    defaultValue={editingServicePost?.clientName || ""}
                    placeholder="Ex: João Silva"
                    className="bg-background"
                    data-testid="input-service-client"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vehicleInfo">Veículo</Label>
                  <Input
                    id="vehicleInfo"
                    name="vehicleInfo"
                    defaultValue={editingServicePost?.vehicleInfo || ""}
                    placeholder="Ex: Harley Davidson Sportster"
                    className="bg-background"
                    data-testid="input-service-vehicle"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imagens e Vídeos ({serviceMediaUrls.length} adicionado{serviceMediaUrls.length !== 1 ? 's' : ''})</Label>
                
                <div className="grid grid-cols-3 gap-2">
                  {serviceMediaUrls.map((url, index) => (
                    <div key={`media-${index}`} className="relative group">
                      {serviceMediaTypes[index] === "image" ? (
                        <img
                          src={url}
                          alt={`Mídia ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-border"
                        />
                      ) : (
                        <div className="w-full h-24 bg-muted rounded-lg flex items-center justify-center border border-border">
                          <Play className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleRemoveServiceMedia(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <div className="w-full h-24">
                    <ImageUpload
                      key={`upload-${serviceMediaUrls.length}`}
                      value=""
                      onChange={(url) => {
                        if (url) handleAddServiceMedia(url, "image");
                      }}
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    id="videoUrlInput"
                    placeholder="Cole a URL do vídeo (YouTube, Vimeo)"
                    className="bg-background flex-1"
                    data-testid="input-service-video-url"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById("videoUrlInput") as HTMLInputElement;
                      if (input && input.value.trim()) {
                        handleAddServiceMedia(input.value.trim(), "video");
                        input.value = "";
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 mr-1" /> Vídeo
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="featured"
                  name="featured"
                  defaultChecked={editingServicePost?.featured || false}
                  className="rounded"
                  data-testid="input-service-featured"
                />
                <Label htmlFor="featured">Destacar na página inicial</Label>
              </div>

              <Button
                type="submit"
                className="w-full bg-primary text-black hover:bg-primary/90 font-bold"
                disabled={createServicePostMutation.isPending || updateServicePostMutation.isPending}
                data-testid="button-save-service"
              >
                {(createServicePostMutation.isPending || updateServicePostMutation.isPending) && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {editingServicePost ? "Atualizar" : "Criar"} Serviço
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {servicePostsLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : servicePosts && servicePosts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {servicePosts.map((post) => (
            <Card key={post.id} className="bg-card border-border overflow-hidden" data-testid={`card-service-${post.id}`}>
              <div className="aspect-video relative">
                {post.mediaUrls && post.mediaUrls.length > 0 ? (
                  post.mediaTypes[0] === "video" ? (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Play className="h-12 w-12 text-primary" />
                    </div>
                  ) : (
                    <img
                      src={post.mediaUrls[0]}
                      alt={post.title}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Image className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                {post.featured && (
                  <div className="absolute top-2 left-2 bg-primary text-black text-xs font-bold px-2 py-1 rounded">
                    DESTAQUE
                  </div>
                )}
                {post.mediaUrls && post.mediaUrls.length > 1 && (
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    +{post.mediaUrls.length - 1} mídia(s)
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-display font-bold text-lg mb-2">{post.title}</h3>
                {post.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.description}</p>
                )}
                <div className="text-xs text-muted-foreground space-y-1">
                  {post.clientName && <p>Cliente: {post.clientName}</p>}
                  {post.vehicleInfo && <p>Veículo: {post.vehicleInfo}</p>}
                  <p>{new Date(post.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingServicePost(post);
                      setServiceMediaUrls(post.mediaUrls || []);
                      setServiceMediaTypes(post.mediaTypes || []);
                      setIsServicePostDialogOpen(true);
                    }}
                    data-testid={`button-edit-service-${post.id}`}
                  >
                    <Pencil className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteServicePostMutation.mutate(post.id)}
                    data-testid={`button-delete-service-${post.id}`}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Camera className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Nenhum serviço cadastrado ainda.</p>
            <p className="text-sm text-muted-foreground mt-2">Adicione fotos e vídeos dos seus trabalhos!</p>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}

export default GalleryManagementPage;
