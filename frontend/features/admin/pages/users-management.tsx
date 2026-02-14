import React, { useState } from "react";
import { TabsContent } from "@/shared/ui/tabs";
import { Card, CardContent } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/shared/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { useUser, useAdminUsers, useAdminUserMutations } from "../hooks/use-admin";
import type { SafeUser } from "@/shared/lib/api";
import { 
  Plus, Pencil, Trash2, Loader2, Shield, User, Key 
} from "lucide-react";

export function UsersManagementPage() {
  const [editingUser, setEditingUser] = useState<SafeUser | null>(null);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);

  const { data: user } = useUser();
  const { data: adminUsers, isLoading: usersLoading } = useAdminUsers();
  const { createUserMutation, updateUserMutation, deleteUserMutation } = useAdminUserMutations();

  const handleUserSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (editingUser) {
      const updateData: { username: string; role: "admin" | "viewer"; password?: string } = {
        username: formData.get("username") as string,
        role: formData.get("role") as "admin" | "viewer",
      };
      const password = formData.get("password") as string;
      if (password) {
        updateData.password = password;
      }
      updateUserMutation.mutate({ id: editingUser.id, data: updateData }, {
        onSuccess: () => {
          setIsUserDialogOpen(false);
          setEditingUser(null);
        }
      });
    } else {
      const createData = {
        username: formData.get("username") as string,
        password: formData.get("password") as string,
        role: formData.get("role") as "admin" | "viewer",
      };
      createUserMutation.mutate(createData, {
        onSuccess: () => {
          setIsUserDialogOpen(false);
        }
      });
    }
  };

  return (
    <TabsContent value="users" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-display font-bold">Gerenciar Usuários Admin</h2>
        <Dialog open={isUserDialogOpen} onOpenChange={(open) => {
          setIsUserDialogOpen(open);
          if (!open) setEditingUser(null);
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-black hover:bg-primary/90" data-testid="button-add-user">
              <Plus className="h-4 w-4 mr-2" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-primary/20 w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
            <DialogHeader>
              <DialogTitle className="font-display">
                {editingUser ? "Editar Usuário" : "Novo Usuário"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleUserSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Nome de Usuário *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="username" name="username" defaultValue={editingUser?.username} required className="pl-10" data-testid="input-user-username" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha *"}</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" name="password" type="password" required={!editingUser} className="pl-10" data-testid="input-user-password" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Perfil *</Label>
                <Select name="role" defaultValue={editingUser?.role || "admin"}>
                  <SelectTrigger data-testid="select-user-role">
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin (acesso total)</SelectItem>
                    <SelectItem value="viewer">Visualizador (somente leitura)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-primary text-black hover:bg-primary/90" data-testid="button-save-user">
                {editingUser ? "Atualizar" : "Criar"} Usuário
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {usersLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : adminUsers && adminUsers.length > 0 ? (
        <div className="grid gap-4">
          {adminUsers.map((adminUser) => (
            <Card key={adminUser.id} className="bg-card border-border" data-testid={`admin-user-${adminUser.id}`}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="h-12 w-12 bg-background rounded-full flex items-center justify-center border border-border">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold">{adminUser.username}</h3>
                  <p className="text-sm text-muted-foreground">
                    {adminUser.role === "admin" ? "Administrador" : "Visualizador"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    adminUser.role === "admin" 
                      ? "bg-primary/20 text-primary" 
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {adminUser.role === "admin" ? "Admin" : "Viewer"}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setEditingUser(adminUser);
                      setIsUserDialogOpen(true);
                    }}
                    data-testid={`button-edit-user-${adminUser.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {user?.id !== adminUser.id && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => deleteUserMutation.mutate(adminUser.id)}
                      data-testid={`button-delete-user-${adminUser.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Nenhum usuário cadastrado ainda.</p>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}

export default UsersManagementPage;
