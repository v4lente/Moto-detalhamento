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

export default function Admin() {
  return (
    <AdminLayout defaultTab="dashboard">
      <DashboardPage />
      <ProductsManagementPage />
      <OrdersManagementPage />
      <CustomersManagementPage />
      <UsersManagementPage />
      <ServicesManagementPage />
      <GalleryManagementPage />
      <AppointmentsManagementPage />
      <SettingsPage />
    </AdminLayout>
  );
}

// Re-export for backwards compatibility
export { Admin };
