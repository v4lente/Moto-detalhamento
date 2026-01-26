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
import React, { useState, useEffect, useRef } from "react";

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

interface AdminTabProps {
  value: string;
  testId: string;
  children: React.ReactNode;
}

function AdminTab({ value, testId, children }: AdminTabProps) {
  const [isActive, setIsActive] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const checkActive = () => {
      if (ref.current) {
        const state = ref.current.getAttribute('data-state');
        setIsActive(state === 'active');
      }
    };
    
    checkActive();
    
    const observer = new MutationObserver(checkActive);
    if (ref.current) {
      observer.observe(ref.current, { attributes: true, attributeFilter: ['data-state'] });
    }
    
    return () => observer.disconnect();
  }, []);

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    whiteSpace: 'nowrap',
    borderRadius: '0.375rem',
    padding: '0.375rem 0.5rem',
    fontSize: '0.875rem',
    fontWeight: isActive ? 700 : 500,
    transition: 'all 0.2s ease',
    outline: 'none',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: isActive ? '#d4ff00' : (isHovered ? 'rgba(212, 255, 0, 0.2)' : 'transparent'),
    color: isActive ? '#000000' : (isHovered ? '#d4ff00' : 'rgba(156, 163, 175, 0.6)'),
  };

  return (
    <TabsPrimitive.Trigger
      ref={ref}
      value={value}
      data-testid={testId}
      style={baseStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </TabsPrimitive.Trigger>
  );
}

export function AdminNavbar() {
  return (
    <TabsList className="bg-card">
      <TooltipProvider delayDuration={300}>
        {navItems.map((item) => (
          <Tooltip key={item.value}>
            <TooltipTrigger asChild>
              <AdminTab
                value={item.value}
                testId={item.testId}
              >
                <span className="sm:mr-2">{item.icon}</span>
                <span className="hidden sm:inline">{item.label}</span>
              </AdminTab>
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
