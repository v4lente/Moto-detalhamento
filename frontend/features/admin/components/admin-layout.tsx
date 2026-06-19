import React from "react";
import { useLocation, Link } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import { Tabs } from "@/shared/ui/tabs";
import { AdminNavbar } from "@/features/admin/components/admin-navbar";
import { getCurrentUser, logout } from "@/shared/lib/api";
import { Home, LogOut, Loader2 } from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab?: string;
  defaultTab?: string;
  onTabChange?: (tab: string) => void;
}

export function AdminLayout({ children, activeTab, defaultTab = "dashboard", onTabChange }: AdminLayoutProps) {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [internalTab, setInternalTab] = React.useState(defaultTab);
  const tabValue = activeTab ?? internalTab;
  const handleTabChange = onTabChange ?? setInternalTab;
  
  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["user"],
    queryFn: getCurrentUser,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  React.useEffect(() => {
    if (!userLoading && !user) {
      queryClient.clear();
      setLocation("/login", { replace: true });
    }
  }, [queryClient, setLocation, user, userLoading]);

  const handleLogout = async () => {
    try {
      await logout();
    } finally {
      queryClient.clear();
      setLocation("/login", { replace: true });
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/40 bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <h1 className="font-display font-bold text-base sm:text-xl uppercase tracking-wider sm:tracking-widest">
            <span className="text-primary">Admin</span> <span className="hidden sm:inline">Panel</span>
          </h1>
          <div className="flex items-center gap-2 sm:gap-4">
            <span className="text-xs sm:text-sm text-muted-foreground hidden sm:inline">Olá, {user.username}</span>
            <Link href="/">
              <Button variant="outline" size="sm" data-testid="link-home" className="px-2 sm:px-4">
                <Home className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Loja</span>
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleLogout} data-testid="button-logout" className="px-2 sm:px-4">
              <LogOut className="h-4 w-4 sm:mr-2" /> <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <Tabs value={tabValue} onValueChange={handleTabChange} className="space-y-6">
          <AdminNavbar />
          {children}
        </Tabs>
      </main>
    </div>
  );
}

export { AdminLayout as default };
