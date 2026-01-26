import * as TabsPrimitive from "@radix-ui/react-tabs";
import { TabsList } from "@/components/ui/tabs";
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
import React from "react";

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
  { value: "appointments", label: "Agenda", icon: <Calendar className="h-4 w-4" />, testId: "tab-appointments" },
  { value: "settings", label: "Config", icon: <Settings className="h-4 w-4" />, testId: "tab-settings" },
];

export function AdminNavbar() {
  return (
    <TabsList className="bg-card">
      <TooltipProvider delayDuration={300}>
        {navItems.map((item) => (
          <Tooltip key={item.value}>
            <TooltipTrigger asChild>
              <TabsPrimitive.Trigger
                value={item.value}
                data-testid={item.testId}
                className="admin-tab-trigger inline-flex items-center justify-center whitespace-nowrap rounded-md px-2 sm:px-3 py-1.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                <span className="sm:mr-2">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </TabsPrimitive.Trigger>
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
