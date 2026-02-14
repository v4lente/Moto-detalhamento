import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/shared/hooks/use-toast";
import {
  fetchProducts, createProduct, updateProduct, deleteProduct,
  fetchSettings, updateSettings, getCurrentUser,
  fetchAllOrders, fetchOrderDetails, updateOrderStatus,
  fetchAllCustomers, createAdminCustomer, updateAdminCustomer, deleteAdminCustomer,
  fetchAllUsers, createAdminUser, updateAdminUser, deleteAdminUser,
  fetchServicePosts, createServicePost, updateServicePost, deleteServicePost,
  fetchAppointments, updateAppointment, deleteAppointment,
  fetchAllOfferedServices, createOfferedService, updateOfferedService, deleteOfferedService,
  fetchProductVariations, createProductVariation, updateProductVariation, deleteProductVariation
} from "@/shared/lib/api";
import type { ProductWithImages, ProductVariation, UpdateSiteSettings, ServicePostWithMedia } from "@shared/contracts";

// User query
export function useUser() {
  return useQuery({
    queryKey: ["user"],
    queryFn: getCurrentUser,
  });
}

// Products queries and mutations
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });
}

export function useProductMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createProductMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto criado com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao criar produto", variant: "destructive" }),
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ProductWithImages> }) => updateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto atualizado!" });
    },
    onError: () => toast({ title: "Erro ao atualizar produto", variant: "destructive" }),
  });

  const deleteProductMutation = useMutation({
    mutationFn: deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      toast({ title: "Produto removido!" });
    },
    onError: () => toast({ title: "Erro ao remover produto", variant: "destructive" }),
  });

  return { createProductMutation, updateProductMutation, deleteProductMutation };
}

// Variations
export function useVariationMutations(
  variations: ProductVariation[],
  setVariations: React.Dispatch<React.SetStateAction<ProductVariation[]>>,
  variationsProductId: number | null,
  setProductVariationCounts: React.Dispatch<React.SetStateAction<Record<number, number>>>
) {
  const { toast } = useToast();

  const createVariationMutation = useMutation({
    mutationFn: ({ productId, data }: { productId: number; data: { label: string; price: number; inStock?: boolean } }) =>
      createProductVariation(productId, data),
    onSuccess: (newVariation) => {
      setVariations([...variations, newVariation]);
      setProductVariationCounts(prev => ({
        ...prev,
        [newVariation.productId]: (prev[newVariation.productId] || 0) + 1
      }));
      toast({ title: "Variação criada!" });
    },
    onError: () => toast({ title: "Erro ao criar variação", variant: "destructive" }),
  });

  const updateVariationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { label: string; price: number; inStock: boolean } }) =>
      updateProductVariation(id, data),
    onSuccess: (updatedVariation) => {
      setVariations(variations.map(v => v.id === updatedVariation.id ? updatedVariation : v));
      toast({ title: "Variação atualizada!" });
    },
    onError: () => toast({ title: "Erro ao atualizar variação", variant: "destructive" }),
  });

  const deleteVariationMutation = useMutation({
    mutationFn: deleteProductVariation,
    onSuccess: (_, deletedId) => {
      const deleted = variations.find(v => v.id === deletedId);
      setVariations(variations.filter(v => v.id !== deletedId));
      if (deleted && variationsProductId) {
        setProductVariationCounts(prev => ({
          ...prev,
          [variationsProductId]: Math.max((prev[variationsProductId] || 0) - 1, 0)
        }));
      }
      toast({ title: "Variação removida!" });
    },
    onError: () => toast({ title: "Erro ao remover variação", variant: "destructive" }),
  });

  return { createVariationMutation, updateVariationMutation, deleteVariationMutation };
}

// Settings
export function useSettings() {
  return useQuery({
    queryKey: ["settings"],
    queryFn: fetchSettings,
  });
}

export function useSettingsMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      toast({ title: "Configurações salvas!" });
    },
    onError: () => toast({ title: "Erro ao salvar configurações", variant: "destructive" }),
  });
}

// Orders
export function useOrders() {
  return useQuery({
    queryKey: ["adminOrders"],
    queryFn: fetchAllOrders,
  });
}

export function useOrderMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateOrderStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminOrders"] });
      toast({ title: "Status do pedido atualizado!" });
    },
    onError: () => toast({ title: "Erro ao atualizar status", variant: "destructive" }),
  });

  return { updateOrderStatusMutation, fetchOrderDetails };
}

// Customers
export function useCustomers() {
  return useQuery({
    queryKey: ["adminCustomers"],
    queryFn: fetchAllCustomers,
  });
}

export function useCustomerMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createCustomerMutation = useMutation({
    mutationFn: createAdminCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCustomers"] });
      toast({ title: "Cliente criado com sucesso!" });
    },
    onError: (error: Error) => toast({ title: "Erro", description: error.message, variant: "destructive" }),
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAdminCustomer>[1] }) => updateAdminCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCustomers"] });
      toast({ title: "Cliente atualizado!" });
    },
    onError: () => toast({ title: "Erro ao atualizar cliente", variant: "destructive" }),
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: deleteAdminCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCustomers"] });
      toast({ title: "Cliente removido!" });
    },
    onError: () => toast({ title: "Erro ao remover cliente", variant: "destructive" }),
  });

  return { createCustomerMutation, updateCustomerMutation, deleteCustomerMutation };
}

// Admin Users
export function useAdminUsers() {
  return useQuery({
    queryKey: ["adminUsers"],
    queryFn: fetchAllUsers,
  });
}

export function useAdminUserMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createUserMutation = useMutation({
    mutationFn: createAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: "Usuário criado com sucesso!" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateAdminUser>[1] }) =>
      updateAdminUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: "Usuário atualizado!" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast({ title: "Usuário removido!" });
    },
    onError: (error: Error) => toast({ title: error.message, variant: "destructive" }),
  });

  return { createUserMutation, updateUserMutation, deleteUserMutation };
}

// Service Posts (Gallery)
export function useServicePosts() {
  return useQuery({
    queryKey: ["servicePosts"],
    queryFn: fetchServicePosts,
  });
}

export function useServicePostMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createServicePostMutation = useMutation({
    mutationFn: createServicePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicePosts"] });
      queryClient.invalidateQueries({ queryKey: ["featuredServicePosts"] });
      toast({ title: "Post de serviço criado com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao criar post de serviço", variant: "destructive" }),
  });

  const updateServicePostMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ServicePostWithMedia> }) => updateServicePost(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicePosts"] });
      queryClient.invalidateQueries({ queryKey: ["featuredServicePosts"] });
      toast({ title: "Post de serviço atualizado!" });
    },
    onError: () => toast({ title: "Erro ao atualizar post de serviço", variant: "destructive" }),
  });

  const deleteServicePostMutation = useMutation({
    mutationFn: deleteServicePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicePosts"] });
      queryClient.invalidateQueries({ queryKey: ["featuredServicePosts"] });
      toast({ title: "Post de serviço removido!" });
    },
    onError: () => toast({ title: "Erro ao remover post de serviço", variant: "destructive" }),
  });

  return { createServicePostMutation, updateServicePostMutation, deleteServicePostMutation };
}

// Appointments
export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: fetchAppointments,
  });
}

export function useAppointmentMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateAppointmentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateAppointment>[1] }) => updateAppointment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Agendamento atualizado!" });
    },
    onError: () => toast({ title: "Erro ao atualizar agendamento", variant: "destructive" }),
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast({ title: "Agendamento removido!" });
    },
    onError: () => toast({ title: "Erro ao remover agendamento", variant: "destructive" }),
  });

  return { updateAppointmentMutation, deleteAppointmentMutation };
}

// Offered Services
export function useOfferedServices() {
  return useQuery({
    queryKey: ["offeredServices"],
    queryFn: fetchAllOfferedServices,
  });
}

export function useOfferedServiceMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createOfferedServiceMutation = useMutation({
    mutationFn: createOfferedService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offeredServices"] });
      toast({ title: "Serviço criado com sucesso!" });
    },
    onError: () => toast({ title: "Erro ao criar serviço", variant: "destructive" }),
  });

  const updateOfferedServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateOfferedService>[1] }) => updateOfferedService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offeredServices"] });
      toast({ title: "Serviço atualizado!" });
    },
    onError: () => toast({ title: "Erro ao atualizar serviço", variant: "destructive" }),
  });

  const deleteOfferedServiceMutation = useMutation({
    mutationFn: deleteOfferedService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offeredServices"] });
      toast({ title: "Serviço removido!" });
    },
    onError: () => toast({ title: "Erro ao remover serviço", variant: "destructive" }),
  });

  return { createOfferedServiceMutation, updateOfferedServiceMutation, deleteOfferedServiceMutation };
}

// Re-export fetchProductVariations for direct use
export { fetchProductVariations };
