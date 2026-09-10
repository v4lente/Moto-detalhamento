import React from "react";
import { AdminLayout } from "./components/admin-layout";
import { DashboardPage } from "./pages/dashboard";
import { ProductsManagementPage } from "./pages/products-management";
import { OrdersManagementPage } from "./pages/orders-management";
import { CustomersManagementPage } from "./pages/customers-management";
import { UsersManagementPage } from "./pages/users-management";
import { ServicesManagementPage } from "./pages/services-management";
import { GalleryManagementPage } from "./pages/gallery-management";
import { AppointmentsManagementPage } from "./pages/appointments-management";
import { SettingsPage } from "./pages/settings";

type AdminTab =
  | "dashboard"
  | "products"
  | "orders"
  | "customers"
  | "users"
  | "offered-services"
  | "services"
  | "appointments"
  | "settings";

function renderActiveTab(tab: AdminTab, onTabChange: (tab: AdminTab) => void, orderToOpen: number | null, onOrderOpened: () => void) {
  switch (tab) {
    case "products":
      return <ProductsManagementPage />;
    case "orders":
      return <OrdersManagementPage initialOrderId={orderToOpen} onInitialOrderHandled={onOrderOpened} />;
    case "customers":
      return <CustomersManagementPage />;
    case "users":
      return <UsersManagementPage />;
    case "offered-services":
      return <ServicesManagementPage />;
    case "services":
      return <GalleryManagementPage />;
    case "appointments":
      return <AppointmentsManagementPage />;
    case "settings":
      return <SettingsPage />;
    case "dashboard":
    default:
      return <DashboardPage onOpenAgenda={() => onTabChange("appointments")} />;
  }
}

export default function Admin() {
  const [activeTab, setActiveTab] = React.useState<AdminTab>("dashboard");
  const [orderToOpen, setOrderToOpen] = React.useState<number | null>(null);

  const openOrderFromNotification = (orderId: number) => {
    setOrderToOpen(orderId);
    setActiveTab("orders");
  };

  return (
    <AdminLayout
      activeTab={activeTab}
      defaultTab="dashboard"
      onTabChange={(tab) => setActiveTab(tab as AdminTab)}
      onOpenOrder={openOrderFromNotification}
    >
      {renderActiveTab(activeTab, setActiveTab, orderToOpen, () => setOrderToOpen(null))}
    </AdminLayout>
  );
}

// Re-export for backwards compatibility
export { Admin };
