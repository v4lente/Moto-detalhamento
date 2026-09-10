import React, { useEffect, useMemo, useRef, useState } from "react";
import { TabsContent } from "@/shared/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Textarea } from "@/shared/ui/textarea";
import { CreatableSelect } from "@/shared/ui/creatable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { useToast } from "@/shared/hooks/use-toast";
import { CustomerPhoneInput } from "@/shared/components/customer-fields";
import {
  useAppointments,
  useAppointmentMutations,
  useCustomers,
  useOfferedServices,
} from "../hooks/use-admin";
import { downloadAppointmentBudget } from "@/shared/lib/api";
import { HttpError } from "@/shared/lib/http";
import { formatCurrencyBRL, formatPhoneBR, normalizePhone } from "@/shared/lib/formatters";
import type {
  AppointmentItemInput,
  AppointmentStatus,
  AppointmentWithItems,
  CreateAppointment,
  Customer,
  OfferedService,
} from "@shared/contracts";
import {
  Archive,
  ArchiveRestore,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Download,
  FilePlus2,
  FileText,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  User,
} from "lucide-react";

const TIME_ZONE = "America/Sao_Paulo";

const STATUS: Record<AppointmentStatus, { label: string; badge: string; dot: string }> = {
  agendado_nao_iniciado: {
    label: "Não iniciado",
    badge: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    dot: "bg-blue-500",
  },
  em_andamento: {
    label: "Em andamento",
    badge: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    dot: "bg-yellow-500",
  },
  concluido: {
    label: "Concluído",
    badge: "bg-green-500/15 text-green-400 border-green-500/30",
    dot: "bg-green-500",
  },
  cancelado: {
    label: "Cancelado",
    badge: "bg-red-500/15 text-red-400 border-red-500/30",
    dot: "bg-red-500",
  },
};

type DraftItem = AppointmentItemInput & { key: string };
type AppointmentFieldErrors = Partial<Record<"customerName" | "customerPhone" | "customerEmail" | "vehicleInfo" | "startAt" | "services", string>>;
type ServiceFieldErrors = Partial<Record<"serviceName" | "description" | "durationMinutes" | "agreedAmount", string>>;

function zonedDateKey(value: Date | string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function zonedDateTimeParts(value: Date | string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value || 0);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function toLocalInput(value: Date | string | null | undefined): string {
  if (!value) return "";
  const parts = zonedDateTimeParts(value);
  return `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}T${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

function localInputToIso(value: string): string {
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const wallClockUtc = Date.UTC(year, month - 1, day, hour, minute);
  let resolvedUtc = wallClockUtc;

  // Resolve the UTC instant whose wall-clock representation belongs to Sao Paulo.
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const represented = zonedDateTimeParts(new Date(resolvedUtc));
    const representedAsUtc = Date.UTC(
      represented.year,
      represented.month - 1,
      represented.day,
      represented.hour,
      represented.minute,
      represented.second,
    );
    resolvedUtc -= representedAsUtc - wallClockUtc;
  }
  return new Date(resolvedUtc).toISOString();
}

function formatDateTime(value: Date | string | null | undefined): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: TIME_ZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (!hours) return `${minutes} min`;
  return `${hours}h${remaining ? ` ${remaining}min` : ""}`;
}

function emptyItem(service?: OfferedService): DraftItem {
  return {
    key: crypto.randomUUID(),
    serviceId: service?.id || null,
    serviceName: service?.name || "",
    description: service?.details || "",
    durationMinutes: service?.estimatedDurationMinutes || 60,
    agreedAmount: service?.approximatePrice != null ? Number(service.approximatePrice).toFixed(2) : null,
  };
}

function statusBadge(status: AppointmentStatus) {
  const config = STATUS[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-xs font-medium ${config.badge}`}>
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

interface AppointmentFormDialogProps {
  open: boolean;
  appointment: AppointmentWithItems | null;
  initialDate: string | null;
  customers: Customer[];
  services: OfferedService[];
  onClose: () => void;
}

function AppointmentFormDialog({ open, appointment, initialDate, customers, services, onClose }: AppointmentFormDialogProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeServices = useMemo(
    () => services.filter((service) => service.isActive),
    [services],
  );
  const mutations = useAppointmentMutations();
  const [customerId, setCustomerId] = useState("walk-in");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [startAt, setStartAt] = useState("");
  const [status, setStatus] = useState<AppointmentStatus>("agendado_nao_iniciado");
  const [completedAt, setCompletedAt] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([]);
  const [serviceEditorOpen, setServiceEditorOpen] = useState(false);
  const [serviceDraft, setServiceDraft] = useState<DraftItem | null>(null);
  const [fieldErrors, setFieldErrors] = useState<AppointmentFieldErrors>({});
  const [serviceFieldErrors, setServiceFieldErrors] = useState<ServiceFieldErrors>({});
  const [budgetState, setBudgetState] = useState<AppointmentWithItems | null>(appointment);

  useEffect(() => {
    if (!open) return;
    setCustomerId(appointment?.customerId || "walk-in");
    setCustomerName(appointment?.customerName || "");
    setCustomerPhone(appointment?.customerPhone || "");
    setCustomerEmail(appointment?.customerEmail || "");
    setVehicleInfo(appointment?.vehicleInfo || "");
    setStartAt(appointment?.startAt
      ? toLocalInput(appointment.startAt)
      : initialDate ? `${initialDate}T09:00` : toLocalInput(new Date(Date.now() + 60 * 60_000)));
    setStatus(appointment?.status || "agendado_nao_iniciado");
    setCompletedAt(toLocalInput(appointment?.completedAt));
    setAdminNotes(appointment?.adminNotes || "");
    setItems(appointment?.items.length
      ? appointment.items.map((item) => ({
          key: String(item.id),
          serviceId: item.serviceId,
          serviceName: item.serviceName,
          description: item.description,
          durationMinutes: item.durationMinutes,
          agreedAmount: item.agreedAmount,
        }))
      : []);
    setFieldErrors({});
    setServiceFieldErrors({});
    setServiceEditorOpen(false);
    setServiceDraft(null);
    setBudgetState(appointment);
  }, [open, appointment, initialDate, activeServices]);

  const totalCents = items.reduce((total, item) => {
    const value = Number(item.agreedAmount || 0);
    return total + (Number.isFinite(value) ? Math.round(value * 100) : 0);
  }, 0);
  const totalDuration = items.reduce((total, item) => total + Number(item.durationMinutes || 0), 0);
  const plannedEnd = startAt && totalDuration > 0
    ? new Date(new Date(localInputToIso(startAt)).getTime() + totalDuration * 60_000)
    : null;

  const openServiceEditor = (item?: DraftItem) => {
    setServiceDraft(item ? { ...item } : emptyItem());
    setServiceFieldErrors({});
    setFieldErrors((current) => ({ ...current, services: undefined }));
    setServiceEditorOpen(true);
  };

  const closeServiceEditor = () => {
    setServiceEditorOpen(false);
    setServiceDraft(null);
    setServiceFieldErrors({});
  };

  const selectOrCreateService = (value: string) => {
    const service = activeServices.find((item) => item.name === value);
    setServiceFieldErrors({});
    setServiceDraft((current) => current ? { ...current, ...(service ? {
      serviceId: service.id,
      serviceName: service.name,
      description: service.details,
      durationMinutes: service.estimatedDurationMinutes,
      agreedAmount: service.approximatePrice != null ? Number(service.approximatePrice).toFixed(2) : null,
    } : {
      serviceId: null,
      serviceName: value,
      description: "",
      durationMinutes: 60,
      agreedAmount: null,
    }) } : current);
  };

  const saveServiceItem = () => {
    if (!serviceDraft) return;
    const errors: ServiceFieldErrors = {};
    if (!(serviceDraft.serviceName || "").trim()) errors.serviceName = "Informe o nome do serviço.";
    if (!(serviceDraft.description || "").trim() || (serviceDraft.description || "").trim().length < 2) errors.description = "Informe uma descrição com ao menos 2 caracteres.";
    if (!Number.isFinite(serviceDraft.durationMinutes) || serviceDraft.durationMinutes < 15) errors.durationMinutes = "A duração mínima é de 15 minutos.";
    if (serviceDraft.agreedAmount != null && (!Number.isFinite(Number(serviceDraft.agreedAmount)) || Number(serviceDraft.agreedAmount) < 0)) errors.agreedAmount = "Informe um valor válido.";
    setServiceFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const firstField = Object.keys(errors)[0];
      requestAnimationFrame(() => document.getElementById(`service-editor-${firstField}`)?.focus());
      return;
    }
    const duplicate = serviceDraft.serviceId
      ? items.find((item) => item.key !== serviceDraft.key && item.serviceId === serviceDraft.serviceId)
      : null;
    if (duplicate) {
      toast({
        title: "Serviço já adicionado",
        description: "Esse serviço do catálogo já está no agendamento. Edite o item existente se precisar ajustar seus dados.",
        variant: "destructive",
      });
      return;
    }
    setItems((current) => current.some((item) => item.key === serviceDraft.key)
      ? current.map((item) => item.key === serviceDraft.key ? serviceDraft : item)
      : [...current, serviceDraft]);
    closeServiceEditor();
  };

  const clearFieldError = (field: keyof AppointmentFieldErrors) => {
    setFieldErrors((current) => current[field] ? { ...current, [field]: undefined } : current);
  };

  const clearServiceFieldError = (field: keyof ServiceFieldErrors) => {
    setServiceFieldErrors((current) => current[field] ? { ...current, [field]: undefined } : current);
  };

  const validateAppointmentForm = () => {
    const errors: AppointmentFieldErrors = {};
    if (customerId === "walk-in") {
      if (customerName.trim().length < 2) errors.customerName = "Informe o nome do proprietário.";
      const phoneDigits = normalizePhone(customerPhone);
      if (!/^\d{10,11}$/.test(phoneDigits)) errors.customerPhone = "Informe um telefone com DDD e 10 ou 11 dígitos.";
      if (customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail.trim())) errors.customerEmail = "Informe um e-mail válido.";
    }
    if (vehicleInfo.trim().length < 2) errors.vehicleInfo = "Informe a moto.";
    if (!startAt) errors.startAt = "Informe a data e hora de início.";
    if (items.length === 0) errors.services = "Adicione ao menos um serviço.";
    else if (items.some((item) => !(item.serviceName || "").trim() || !(item.description || "").trim() || !Number.isFinite(item.durationMinutes) || item.durationMinutes < 15)) {
      errors.services = "Revise os dados dos serviços adicionados.";
    }
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      const fieldOrder: Array<keyof AppointmentFieldErrors> = ["customerName", "customerPhone", "customerEmail", "vehicleInfo", "startAt", "services"];
      const firstField = fieldOrder.find((field) => errors[field]);
      requestAnimationFrame(() => document.getElementById(`appointment-${firstField}`)?.focus());
      toast({ title: "Revise os campos destacados", description: "Corrija as informações indicadas antes de salvar.", variant: "destructive" });
      return false;
    }
    return true;
  };

  const save = async (allowConflict = false) => {
    if (!validateAppointmentForm()) return;

    const payload: CreateAppointment = {
      customerId: customerId === "walk-in" ? null : customerId,
      customerName: customerId === "walk-in" ? customerName : undefined,
      customerPhone: customerId === "walk-in" ? customerPhone : undefined,
      customerEmail: customerId === "walk-in" ? customerEmail || null : undefined,
      vehicleInfo,
      startAt: localInputToIso(startAt),
      status,
      completedAt: status === "concluido" && completedAt ? localInputToIso(completedAt) : null,
      adminNotes: adminNotes || null,
      items: items.map(({ key: _key, ...item }) => ({
        ...item,
        serviceId: item.serviceId || null,
        agreedAmount: item.agreedAmount || null,
      })),
      allowConflict,
    };

    try {
      if (appointment) {
        await mutations.updateAppointmentMutation.mutateAsync({ id: appointment.id, data: payload });
      } else {
        await mutations.createAppointmentMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error) {
      const conflict = error instanceof HttpError
        && error.status === 409
        && (error.payload as { error?: { code?: string; conflicts?: Array<{ customerName: string; vehicleInfo: string; startAt: string }> } })?.error?.code === "SCHEDULE_CONFLICT";
      if (conflict) {
        const conflicts = (error as HttpError).payload as { error: { conflicts: Array<{ customerName: string; vehicleInfo: string; startAt: string }> } };
        const details = conflicts.error.conflicts
          .map((item) => `${item.customerName} — ${item.vehicleInfo} (${formatDateTime(item.startAt)})`)
          .join("\n");
        if (window.confirm(`Conflito de horário detectado:\n\n${details}\n\nDeseja salvar mesmo assim?`)) {
          await save(true);
        }
        return;
      }
      toast({ title: "Não foi possível salvar", description: error instanceof Error ? error.message : "Tente novamente", variant: "destructive" });
    }
  };

  const generateBudget = async () => {
    if (!appointment) return;
    const replace = Boolean(budgetState?.budgetStorageKey);
    if (replace && !window.confirm("Este agendamento já possui um orçamento. Deseja substituí-lo?")) return;
    try {
      const updated = await mutations.generateBudgetMutation.mutateAsync({ id: appointment.id, replace });
      setBudgetState(updated);
      toast({ title: "Orçamento PDF gerado!" });
    } catch (error) {
      toast({ title: "Falha ao gerar orçamento", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    }
  };

  const uploadBudget = async (file?: File) => {
    if (!appointment || !file) return;
    const replace = Boolean(budgetState?.budgetStorageKey);
    if (replace && !window.confirm("Este agendamento já possui um orçamento. Deseja substituí-lo?")) return;
    try {
      const updated = await mutations.uploadBudgetMutation.mutateAsync({ id: appointment.id, file, replace });
      setBudgetState(updated);
      toast({ title: "Orçamento anexado!" });
    } catch (error) {
      toast({ title: "Falha ao anexar orçamento", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeBudget = async () => {
    if (!appointment || !budgetState?.budgetStorageKey || !window.confirm("Remover o orçamento atual?")) return;
    try {
      await mutations.removeBudgetMutation.mutateAsync(appointment.id);
      setBudgetState({ ...budgetState, budgetStorageKey: null, budgetOriginalName: null, budgetMimeType: null, budgetSource: null, budgetUpdatedAt: null });
      toast({ title: "Orçamento removido" });
    } catch (error) {
      toast({ title: "Falha ao remover orçamento", description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    }
  };

  const pending = mutations.createAppointmentMutation.isPending || mutations.updateAppointmentMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className={`max-h-[92vh] w-[96vw] overflow-y-auto border-primary/20 bg-card ${serviceEditorOpen ? "max-w-lg" : "max-w-4xl"}`} aria-describedby={undefined}>
        {serviceEditorOpen && serviceDraft ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">{items.some((item) => item.key === serviceDraft.key) ? "Editar serviço" : "Adicionar serviço"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Serviço *</Label>
                <CreatableSelect
                  id="service-editor-serviceName"
                  value={serviceDraft.serviceName}
                  options={activeServices.map((service) => service.name)}
                  onChange={selectOrCreateService}
                  placeholder="Buscar ou cadastrar serviço..."
                  createLabel="Cadastrar serviço avulso"
                  aria-invalid={Boolean(serviceFieldErrors.serviceName)}
                  aria-describedby={serviceFieldErrors.serviceName ? "service-editor-serviceName-error" : undefined}
                  className={serviceFieldErrors.serviceName ? "border-destructive focus-visible:ring-destructive" : ""}
                  data-testid="select-service-editor"
                />
                {serviceFieldErrors.serviceName && <p id="service-editor-serviceName-error" className="text-xs text-destructive">{serviceFieldErrors.serviceName}</p>}
                <p className="text-xs text-muted-foreground">Busque no catálogo ou digite um novo nome para criar um serviço avulso neste agendamento.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="service-editor-description">Descrição</Label>
                <Textarea id="service-editor-description" value={serviceDraft.description || ""} onChange={(event) => { setServiceDraft((current) => current ? { ...current, description: event.target.value } : current); clearServiceFieldError("description"); }} rows={3} placeholder="Descreva o serviço combinado" aria-invalid={Boolean(serviceFieldErrors.description)} aria-describedby={serviceFieldErrors.description ? "service-editor-description-error" : undefined} className={serviceFieldErrors.description ? "border-destructive focus-visible:ring-destructive" : ""} data-testid="input-service-editor-description" />
                {serviceFieldErrors.description && <p id="service-editor-description-error" className="text-xs text-destructive">{serviceFieldErrors.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="service-editor-durationMinutes">Duração (min) *</Label>
                  <Input id="service-editor-durationMinutes" type="number" min="15" max="1440" step="15" value={serviceDraft.durationMinutes} onChange={(event) => { setServiceDraft((current) => current ? { ...current, durationMinutes: Number(event.target.value) } : current); clearServiceFieldError("durationMinutes"); }} aria-invalid={Boolean(serviceFieldErrors.durationMinutes)} aria-describedby={serviceFieldErrors.durationMinutes ? "service-editor-durationMinutes-error" : undefined} className={serviceFieldErrors.durationMinutes ? "border-destructive focus-visible:ring-destructive" : ""} data-testid="input-service-editor-duration" />
                  {serviceFieldErrors.durationMinutes && <p id="service-editor-durationMinutes-error" className="text-xs text-destructive">{serviceFieldErrors.durationMinutes}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="service-editor-agreedAmount">Valor (R$)</Label>
                  <Input id="service-editor-agreedAmount" type="number" min="0" step="0.01" value={serviceDraft.agreedAmount || ""} onChange={(event) => { setServiceDraft((current) => current ? { ...current, agreedAmount: event.target.value || null } : current); clearServiceFieldError("agreedAmount"); }} aria-invalid={Boolean(serviceFieldErrors.agreedAmount)} aria-describedby={serviceFieldErrors.agreedAmount ? "service-editor-agreedAmount-error" : undefined} className={serviceFieldErrors.agreedAmount ? "border-destructive focus-visible:ring-destructive" : ""} data-testid="input-service-editor-amount" />
                  {serviceFieldErrors.agreedAmount && <p id="service-editor-agreedAmount-error" className="text-xs text-destructive">{serviceFieldErrors.agreedAmount}</p>}
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border pt-4">
                <Button type="button" variant="outline" onClick={closeServiceEditor}>Voltar</Button>
                <Button type="button" className="bg-primary text-black hover:bg-primary/90" onClick={saveServiceItem} data-testid="button-confirm-appointment-service">
                  {items.some((item) => item.key === serviceDraft.key) ? "Salvar alterações" : "Adicionar ao agendamento"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
        <DialogHeader>
          <DialogTitle className="font-display">{appointment ? `Editar Agendamento #${appointment.id}` : "Novo Agendamento"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <select
                value={customerId}
                onChange={(event) => {
                  setCustomerId(event.target.value);
                  if (event.target.value !== "walk-in") {
                    clearFieldError("customerName");
                    clearFieldError("customerPhone");
                    clearFieldError("customerEmail");
                  }
                }}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                data-testid="select-appointment-customer"
              >
                <option value="walk-in">Cliente avulso</option>
                {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name} — {formatPhoneBR(customer.phone)}</option>)}
              </select>
            </div>

            {customerId === "walk-in" && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="appointment-customerName">Proprietário *</Label>
                  <Input id="appointment-customerName" value={customerName} onChange={(event) => { setCustomerName(event.target.value); clearFieldError("customerName"); }} aria-invalid={Boolean(fieldErrors.customerName)} aria-describedby={fieldErrors.customerName ? "appointment-customerName-error" : undefined} className={fieldErrors.customerName ? "border-destructive focus-visible:ring-destructive" : ""} data-testid="input-appointment-owner" />
                  {fieldErrors.customerName && <p id="appointment-customerName-error" className="text-xs text-destructive">{fieldErrors.customerName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="appointment-customerPhone">Telefone *</Label>
                  <CustomerPhoneInput
                    id="appointment-customerPhone"
                    value={customerPhone}
                    onValueChange={(value) => {
                      setCustomerPhone(formatPhoneBR(normalizePhone(value).slice(0, 11)));
                      clearFieldError("customerPhone");
                    }}
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={15}
                    placeholder="(00) 00000-0000"
                    aria-invalid={Boolean(fieldErrors.customerPhone)}
                    aria-describedby={fieldErrors.customerPhone ? "appointment-customerPhone-error" : undefined}
                    className={fieldErrors.customerPhone ? "border-destructive focus-visible:ring-destructive" : ""}
                    data-testid="input-appointment-phone"
                  />
                  {fieldErrors.customerPhone && <p id="appointment-customerPhone-error" className="text-xs text-destructive">{fieldErrors.customerPhone}</p>}
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="appointment-customerEmail">E-mail</Label>
                  <Input id="appointment-customerEmail" type="email" value={customerEmail} onChange={(event) => { setCustomerEmail(event.target.value); clearFieldError("customerEmail"); }} autoComplete="email" aria-invalid={Boolean(fieldErrors.customerEmail)} aria-describedby={fieldErrors.customerEmail ? "appointment-customerEmail-error" : undefined} className={fieldErrors.customerEmail ? "border-destructive focus-visible:ring-destructive" : ""} data-testid="input-appointment-email" />
                  {fieldErrors.customerEmail && <p id="appointment-customerEmail-error" className="text-xs text-destructive">{fieldErrors.customerEmail}</p>}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="appointment-vehicleInfo">Moto *</Label>
              <Input id="appointment-vehicleInfo" value={vehicleInfo} onChange={(event) => { setVehicleInfo(event.target.value); clearFieldError("vehicleInfo"); }} placeholder="Ex.: Honda CB 500F" aria-invalid={Boolean(fieldErrors.vehicleInfo)} aria-describedby={fieldErrors.vehicleInfo ? "appointment-vehicleInfo-error" : undefined} className={fieldErrors.vehicleInfo ? "border-destructive focus-visible:ring-destructive" : ""} data-testid="input-appointment-vehicle" />
              {fieldErrors.vehicleInfo && <p id="appointment-vehicleInfo-error" className="text-xs text-destructive">{fieldErrors.vehicleInfo}</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="appointment-startAt">Início *</Label>
                <Input id="appointment-startAt" type="datetime-local" value={startAt} onChange={(event) => { setStartAt(event.target.value); clearFieldError("startAt"); }} aria-invalid={Boolean(fieldErrors.startAt)} aria-describedby={fieldErrors.startAt ? "appointment-startAt-error" : undefined} className={fieldErrors.startAt ? "border-destructive focus-visible:ring-destructive" : ""} data-testid="input-appointment-start" />
                {fieldErrors.startAt && <p id="appointment-startAt-error" className="text-xs text-destructive">{fieldErrors.startAt}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="appointment-status">Status</Label>
                <select id="appointment-status" value={status} onChange={(event) => setStatus(event.target.value as AppointmentStatus)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid="select-appointment-status">
                  {Object.entries(STATUS).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
                </select>
              </div>
            </div>

            {status === "concluido" && (
              <div className="space-y-2">
                <Label htmlFor="appointment-completed">Término real</Label>
                <Input id="appointment-completed" type="datetime-local" value={completedAt} onChange={(event) => setCompletedAt(event.target.value)} />
                <p className="text-xs text-muted-foreground">Se ficar vazio, o horário será preenchido ao salvar.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="appointment-notes">Observações</Label>
              <Textarea id="appointment-notes" value={adminNotes} onChange={(event) => setAdminNotes(event.target.value)} rows={4} data-testid="input-appointment-notes" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Serviços *</Label>
                <p className="text-xs text-muted-foreground">Valores e duração ficam registrados neste agendamento.</p>
              </div>
              <Button id="appointment-services" type="button" variant="outline" size="sm" onClick={() => openServiceEditor()} aria-invalid={Boolean(fieldErrors.services)} className={fieldErrors.services ? "border-destructive text-destructive" : ""} data-testid="button-add-appointment-service">
                <Plus className="mr-1 h-4 w-4" /> Adicionar serviço
              </Button>
            </div>

            {activeServices.length === 0 && (
              <p className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm text-muted-foreground">Nenhum serviço ativo no catálogo. Você ainda pode cadastrar serviços avulsos neste agendamento.</p>
            )}
            {fieldErrors.services && <p className="text-xs text-destructive">{fieldErrors.services}</p>}

            <div className="space-y-2">
              {items.length === 0 && (
                <button type="button" onClick={() => openServiceEditor()} className="w-full rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:bg-primary/5 hover:text-foreground">
                  <Plus className="mx-auto mb-2 h-5 w-5 text-primary" />
                  Nenhum serviço adicionado. Clique para adicionar o primeiro.
                </button>
              )}
              {items.map((item, index) => (
                <div key={item.key} className="flex flex-col gap-3 rounded-lg border border-border bg-background/50 p-3 sm:flex-row sm:items-center" data-testid={`appointment-service-item-${index}`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium">{item.serviceName}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${item.serviceId ? "border-blue-500/30 bg-blue-500/10 text-blue-400" : "border-primary/30 bg-primary/10 text-primary"}`}>
                        {item.serviceId ? "Catálogo" : "Avulso"}
                      </span>
                    </div>
                    {item.description && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.description}</p>}
                  </div>
                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div className="whitespace-nowrap text-right text-xs">
                      <p>{durationLabel(item.durationMinutes)}</p>
                      <p className="font-semibold text-primary">{item.agreedAmount != null ? formatCurrencyBRL(Number(item.agreedAmount)) : "Valor a definir"}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="icon" onClick={() => openServiceEditor(item)} aria-label={`Editar ${item.serviceName}`} data-testid={`button-edit-appointment-service-${index}`}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="text-destructive" onClick={() => setItems((current) => current.filter((currentItem) => currentItem.key !== item.key))} aria-label={`Remover ${item.serviceName}`}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
              <div>
                <span className="text-muted-foreground">Duração prevista</span>
                <p className="font-semibold">{durationLabel(totalDuration)}</p>
                {plannedEnd && <p className="text-xs text-muted-foreground">Até {formatDateTime(plannedEnd)}</p>}
              </div>
              <div><span className="text-muted-foreground">Valor</span><p className="font-semibold text-primary">{formatCurrencyBRL(totalCents / 100)}</p></div>
            </div>

            {appointment && (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="flex items-center gap-2 font-medium"><FileText className="h-4 w-4 text-primary" /> Orçamento</div>
                {budgetState?.budgetStorageKey ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{budgetState.budgetOriginalName}</span>
                    <Button type="button" variant="outline" size="sm" onClick={() => downloadAppointmentBudget(appointment.id, budgetState.budgetOriginalName || `ORC-${appointment.id}.pdf`)}><Download className="mr-1 h-4 w-4" /> Baixar</Button>
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={removeBudget}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ) : <p className="text-sm text-muted-foreground">Nenhum orçamento anexado.</p>}
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={mutations.uploadBudgetMutation.isPending}><Upload className="mr-1 h-4 w-4" /> Anexar</Button>
                  <Button type="button" variant="outline" size="sm" onClick={generateBudget} disabled={mutations.generateBudgetMutation.isPending}><FilePlus2 className="mr-1 h-4 w-4" /> Gerar PDF</Button>
                  <input ref={fileInputRef} className="hidden" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => uploadBudget(event.target.files?.[0])} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" className="bg-primary text-black hover:bg-primary/90" onClick={() => save()} disabled={pending || items.length === 0} data-testid="button-save-appointment">
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar agendamento
          </Button>
        </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function MonthCalendar({ month, appointments, onOpen, onCreate }: {
  month: Date;
  appointments: AppointmentWithItems[];
  onOpen: (id: number) => void;
  onCreate: (date: string) => void;
}) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (firstDay.getDay() + 6) % 7;
  const days = Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), index - offset + 1));
  const todayKey = zonedDateKey(new Date());
  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentWithItems[]>();
    appointments.filter((item) => item.status !== "cancelado").forEach((appointment) => {
      const key = zonedDateKey(appointment.startAt);
      map.set(key, [...(map.get(key) || []), appointment]);
    });
    map.forEach((items) => items.sort(
      (left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime(),
    ));
    return map;
  }, [appointments]);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-7 bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day, index) => (
          <div key={day} className={`p-2 ${index >= 5 ? "bg-primary/5 text-primary/80" : ""}`}>{day}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = monthKey(day) + `-${String(day.getDate()).padStart(2, "0")}`;
          const dayAppointments = grouped.get(key) || [];
          const outside = day.getMonth() !== month.getMonth();
          const isToday = key === todayKey;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const createAppointment = () => onCreate(key);
          return (
            <div
              key={key}
              role="button"
              tabIndex={0}
              aria-label={`Criar agendamento em ${day.toLocaleDateString("pt-BR")}`}
              title={`Clique para criar um agendamento em ${day.toLocaleDateString("pt-BR")}`}
              data-testid={`calendar-day-${key}`}
              onClick={createAppointment}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  createAppointment();
                }
              }}
              className={`group relative min-h-24 cursor-pointer border-r border-t border-border p-1.5 transition-all duration-150 last:border-r-0 hover:z-10 hover:bg-primary/10 hover:ring-1 hover:ring-inset hover:ring-primary/70 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary ${
                outside
                  ? "bg-muted/15 text-muted-foreground/50"
                  : isWeekend ? "bg-muted/35" : "bg-card/30"
              } ${isToday ? "bg-primary/15 ring-2 ring-inset ring-primary/80" : ""}`}
            >
              <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs ${isToday ? "bg-primary font-bold text-primary-foreground" : ""}`}>
                {day.getDate()}
              </span>
              <span className="pointer-events-none absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded bg-primary px-1.5 py-0.5 text-[9px] font-semibold text-primary-foreground opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <Plus className="h-3 w-3" /> Agendar
              </span>
              <div className="mt-1 space-y-1">
                {dayAppointments.slice(0, 3).map((appointment) => (
                  <button key={appointment.id} type="button" onClick={(event) => { event.stopPropagation(); onOpen(appointment.id); }} onKeyDown={(event) => event.stopPropagation()} className="relative z-20 block w-full truncate rounded bg-muted px-1.5 py-1 text-left text-[10px] hover:bg-muted/80" title={`${appointment.customerName} — ${appointment.vehicleInfo}`}>
                    <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${STATUS[appointment.status].dot}`} />
                    {new Intl.DateTimeFormat("pt-BR", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit" }).format(new Date(appointment.startAt))} {appointment.vehicleInfo}
                  </button>
                ))}
                {dayAppointments.length > 3 && <span className="block text-[10px] text-muted-foreground">+{dayAppointments.length - 3} outros</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AppointmentsManagementPage() {
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<AppointmentStatus | "active" | "all">("active");
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived" | "all">("active");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newAppointmentDate, setNewAppointmentDate] = useState<string | null>(null);
  const filters = { month: monthKey(currentMonth), status: "all" as const, query, archived: archiveFilter };
  const { data: appointments = [], isLoading } = useAppointments(filters);
  const { data: customers = [] } = useCustomers();
  const { data: services = [] } = useOfferedServices();
  const mutations = useAppointmentMutations();
  const visibleAppointments = statusFilter === "active"
    ? appointments.filter((item) => item.status !== "cancelado")
    : statusFilter === "all" ? appointments : appointments.filter((item) => item.status === statusFilter);
  const editingAppointment = appointments.find((item) => item.id === editingId) || null;

  const openAppointment = (id: number) => {
    setNewAppointmentDate(null);
    setEditingId(id);
    setDialogOpen(true);
  };

  const openNewAppointment = (date: string | null = null) => {
    setEditingId(null);
    setNewAppointmentDate(date);
    setDialogOpen(true);
  };

  const archive = async (appointment: AppointmentWithItems) => {
    const action = appointment.archivedAt ? "restaurar" : "arquivar";
    if (!window.confirm(`Deseja ${action} este agendamento?`)) return;
    try {
      if (appointment.archivedAt) await mutations.restoreAppointmentMutation.mutateAsync(appointment.id);
      else await mutations.archiveAppointmentMutation.mutateAsync(appointment.id);
    } catch (error) {
      toast({ title: `Não foi possível ${action}`, description: error instanceof Error ? error.message : undefined, variant: "destructive" });
    }
  };

  const whatsappUrl = (appointment: AppointmentWithItems) => {
    const servicesText = appointment.items.map((item) => `• ${item.serviceName}`).join("\n");
    const message = `Olá ${appointment.customerName}!\n\nSobre o serviço da sua moto:\n🏍️ ${appointment.vehicleInfo}\n📅 ${formatDateTime(appointment.startAt)}\n📋 ${STATUS[appointment.status].label}\n${servicesText}${appointment.totalAmount ? `\n💰 ${formatCurrencyBRL(appointment.totalAmount)}` : ""}\n\nDaniel Valente Moto Detalhamento`;
    return `https://wa.me/${appointment.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
  };

  return (
    <TabsContent value="appointments" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Agenda Operacional</h2>
          <p className="text-sm text-muted-foreground">Agendamentos e execução dos serviços de detalhamento.</p>
        </div>
        <Button className="bg-primary text-black hover:bg-primary/90" onClick={() => openNewAppointment()} data-testid="button-new-appointment">
          <Plus className="mr-2 h-4 w-4" /> Novo agendamento
        </Button>
      </div>

      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2 text-lg"><CalendarDays className="h-5 w-5 text-primary" /> {currentMonth.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} aria-label="Mês anterior"><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" onClick={() => setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}>Hoje</Button>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} aria-label="Próximo mês"><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <MonthCalendar month={currentMonth} appointments={visibleAppointments} onOpen={openAppointment} onCreate={openNewAppointment} />}
        </CardContent>
      </Card>

      <Card className="border-border bg-card">
        <CardHeader className="space-y-4">
          <CardTitle className="text-lg">Agendamentos do mês</CardTitle>
          <div className="grid gap-2 md:grid-cols-[1fr_190px_160px]">
            <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar proprietário, telefone, moto ou serviço" value={query} onChange={(event) => setQuery(event.target.value)} data-testid="input-appointment-search" /></div>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="active">Operacionais</option>
              <option value="all">Todos os status</option>
              {Object.entries(STATUS).map(([value, config]) => <option key={value} value={value}>{config.label}</option>)}
            </select>
            <select value={archiveFilter} onChange={(event) => setArchiveFilter(event.target.value as typeof archiveFilter)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
              <option value="active">Não arquivados</option>
              <option value="archived">Arquivados</option>
              <option value="all">Todos</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {visibleAppointments.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground"><CalendarDays className="mx-auto mb-3 h-10 w-10" /><p>Nenhum agendamento encontrado.</p></div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1120px] text-sm">
                  <thead><tr className="border-b border-border text-left text-xs uppercase text-muted-foreground"><th className="p-3">Início</th><th className="p-3">Moto</th><th className="p-3">Proprietário</th><th className="p-3">Telefone</th><th className="p-3">Status</th><th className="p-3">Término</th><th className="p-3">Orçamento</th><th className="p-3">Observações</th><th className="p-3 text-right">Valor</th><th className="p-3">Ações</th></tr></thead>
                  <tbody>{visibleAppointments.map((appointment) => (
                    <tr key={appointment.id} className="border-b border-border/60 hover:bg-muted/20" data-testid={`appointment-row-${appointment.id}`}>
                      <td className="whitespace-nowrap p-3">{formatDateTime(appointment.startAt)}</td>
                      <td className="p-3 font-medium">{appointment.vehicleInfo}</td>
                      <td className="p-3">{appointment.customerName}</td>
                      <td className="whitespace-nowrap p-3">{formatPhoneBR(appointment.customerPhone)}</td>
                      <td className="p-3">{statusBadge(appointment.status)}</td>
                      <td className="whitespace-nowrap p-3">
                        {formatDateTime(appointment.completedAt || appointment.plannedEndAt)}
                        <span className="block text-[10px] text-muted-foreground">
                          {appointment.completedAt ? "Real" : "Previsto"}
                        </span>
                      </td>
                      <td className="p-3">{appointment.budgetStorageKey ? <Button variant="ghost" size="sm" onClick={() => downloadAppointmentBudget(appointment.id, appointment.budgetOriginalName || `ORC-${appointment.id}.pdf`)}><Download className="mr-1 h-4 w-4" /> Arquivo</Button> : "—"}</td>
                      <td className="max-w-48 truncate p-3" title={appointment.adminNotes || ""}>{appointment.adminNotes || "—"}</td>
                      <td className="whitespace-nowrap p-3 text-right font-semibold text-primary">{appointment.totalAmount ? formatCurrencyBRL(appointment.totalAmount) : "—"}</td>
                      <td className="p-3"><div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openAppointment(appointment.id)} aria-label="Editar"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" asChild><a href={whatsappUrl(appointment)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle className="h-4 w-4 text-green-500" /></a></Button>
                        {(appointment.archivedAt || ["concluido", "cancelado"].includes(appointment.status)) && <Button variant="ghost" size="icon" onClick={() => archive(appointment)} aria-label={appointment.archivedAt ? "Restaurar" : "Arquivar"}>{appointment.archivedAt ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}</Button>}
                      </div></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">{visibleAppointments.map((appointment) => (
                <Card key={appointment.id} className="border-border bg-background/40" data-testid={`appointment-card-${appointment.id}`}>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-semibold">{appointment.vehicleInfo}</p><p className="text-sm text-muted-foreground">{appointment.customerName}</p></div>
                      {statusBadge(appointment.status)}
                    </div>
                    <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Início: {formatDateTime(appointment.startAt)}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {appointment.completedAt ? "Fim" : "Fim previsto"}: {formatDateTime(appointment.completedAt || appointment.plannedEndAt)}</span>
                      <span className="flex items-center gap-1"><User className="h-3 w-3" /> {formatPhoneBR(appointment.customerPhone)}</span>
                      <span>{appointment.budgetStorageKey ? "Orçamento disponível" : "Sem orçamento"}</span>
                    </div>
                    {appointment.adminNotes && <p className="line-clamp-2 text-xs text-muted-foreground">{appointment.adminNotes}</p>}
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-primary">{appointment.totalAmount ? formatCurrencyBRL(appointment.totalAmount) : "Valor a definir"}</span>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => openAppointment(appointment.id)}>Detalhes</Button>
                        <Button variant="ghost" size="icon" asChild><a href={whatsappUrl(appointment)} target="_blank" rel="noreferrer" aria-label="WhatsApp"><MessageCircle className="h-4 w-4 text-green-500" /></a></Button>
                        {(appointment.archivedAt || ["concluido", "cancelado"].includes(appointment.status)) && (
                          <Button variant="ghost" size="icon" onClick={() => archive(appointment)} aria-label={appointment.archivedAt ? "Restaurar" : "Arquivar"}>
                            {appointment.archivedAt ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}</div>
            </>
          )}
        </CardContent>
      </Card>

      <AppointmentFormDialog
        open={dialogOpen}
        appointment={editingAppointment}
        initialDate={newAppointmentDate}
        customers={customers}
        services={services}
        onClose={() => { setDialogOpen(false); setEditingId(null); setNewAppointmentDate(null); }}
      />
    </TabsContent>
  );
}

export default AppointmentsManagementPage;
