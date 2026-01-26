import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Shield, 
  Camera, 
  Calendar, 
  Settings 
} from "lucide-react";

interface AdminNavItem {
  value: string;
  label: string;
  icon: React.ReactNode;
  testId: string;
}

const navItems: AdminNavItem[] = [
  { value: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" />, testId: "tab-dashboard" },
  { value: "products", label: "Produtos", icon: <Package className="h-4 w-4" />, testId: "tab-products" },
  { value: "orders", label: "Pedidos", icon: <ShoppingBag className="h-4 w-4" />, testId: "tab-orders" },
  { value: "customers", label: "Clientes", icon: <Users className="h-4 w-4" />, testId: "tab-customers" },
  { value: "users", label: "Usuários", icon: <Shield className="h-4 w-4" />, testId: "tab-users" },
  { value: "services", label: "Serviços", icon: <Camera className="h-4 w-4" />, testId: "tab-services" },
  { value: "appointments", label: "Agenda", icon: <Calendar className="h-4 w-4 text-primary" />, testId: "tab-appointments" },
  { value: "settings", label: "Config", icon: <Settings className="h-4 w-4" />, testId: "tab-settings" },
];

export function AdminNavbar() {
  return (
    <TabsList className="bg-card inline-flex min-w-max sm:flex-wrap gap-1">
      <TooltipProvider delayDuration={300}>
        {navItems.map((item) => (
          <Tooltip key={item.value}>
            <TooltipTrigger asChild>
              <TabsTrigger 
                value={item.value} 
                className="data-[state=active]:bg-primary data-[state=active]:text-black data-[state=inactive]:text-muted-foreground data-[state=inactive]:opacity-60 data-[state=active]:opacity-100 data-[state=active]:font-semibold px-2 sm:px-4 transition-all duration-200 data-[state=active]:shadow-[0_0_12px_rgba(212,255,0,0.5)]" 
                data-testid={item.testId}
              >
                <span className="sm:mr-2">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </TabsTrigger>
            </TooltipTrigger>
            <TooltipContent className="sm:hidden">
              <p>{item.label}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </TooltipProvider>
    </TabsList>
  );
}
