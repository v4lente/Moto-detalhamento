import { useEffect, useState } from "react";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { formatDocumentInput, formatPhoneBR } from "@/shared/lib/formatters";
import { Button } from "@/shared/ui/button";

type CustomerDocumentType = "cpf" | "cnpj";

interface CustomerPhoneInputProps extends Omit<React.ComponentProps<typeof Input>, "value" | "defaultValue" | "onChange"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function CustomerPhoneInput({ value, defaultValue = "", onValueChange, ...props }: CustomerPhoneInputProps) {
  const [internalValue, setInternalValue] = useState(() => formatPhoneBR(defaultValue));
  const controlled = value !== undefined;

  useEffect(() => {
    if (controlled) setInternalValue(formatPhoneBR(value));
  }, [controlled, value]);

  const displayValue = controlled ? formatPhoneBR(value) : internalValue;
  return (
    <Input
      {...props}
      value={displayValue}
      onChange={(event) => {
        const nextValue = formatPhoneBR(event.target.value);
        if (!controlled) setInternalValue(nextValue);
        onValueChange?.(nextValue);
      }}
    />
  );
}

interface CustomerDocumentFieldsProps {
  documentType?: CustomerDocumentType;
  document?: string;
  defaultDocumentType?: CustomerDocumentType;
  defaultDocument?: string;
  maskedDocument?: string;
  documentTypeName?: string;
  documentName?: string;
  onDocumentTypeChange?: (value: CustomerDocumentType) => void;
  onDocumentChange?: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function CustomerDocumentFields({
  documentType,
  document,
  defaultDocumentType = "cpf",
  defaultDocument = "",
  maskedDocument,
  documentTypeName = "documentType",
  documentName = "document",
  onDocumentTypeChange,
  onDocumentChange,
  required = false,
  disabled = false,
  className = "grid grid-cols-2 gap-4",
}: CustomerDocumentFieldsProps) {
  const [internalType, setInternalType] = useState<CustomerDocumentType>(defaultDocumentType);
  const [internalDocument, setInternalDocument] = useState(() => formatDocumentInput(defaultDocument, defaultDocumentType));
  const [isDocumentEditing, setIsDocumentEditing] = useState(!maskedDocument);
  const controlledType = documentType !== undefined;
  const controlledDocument = document !== undefined;
  const type = controlledType ? documentType : internalType;
  const currentDocument = controlledDocument ? document : internalDocument;

  useEffect(() => {
    if (controlledDocument) setInternalDocument(formatDocumentInput(document, type));
  }, [controlledDocument, document, type]);

  if (maskedDocument && !isDocumentEditing) {
    return (
      <div className={className}>
        <div className="space-y-2">
          <Label>Tipo de documento</Label>
          <div className="h-9 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm">{type.toUpperCase()}</div>
        </div>
        <div className="space-y-2">
          <Label>Documento</Label>
          <div className="h-9 rounded-md border border-input bg-muted/30 px-3 py-2 text-sm tracking-wide">{maskedDocument}</div>
        </div>
        <div className="col-span-full flex justify-end">
          <Button type="button" variant="outline" onClick={() => {
            setInternalDocument("");
            setIsDocumentEditing(true);
          }}>Alterar documento</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-2">
        <Label htmlFor={documentTypeName}>Tipo de documento {required && "*"}</Label>
        <select
          id={documentTypeName}
          name={documentTypeName}
          value={type}
          disabled={disabled}
          required={required}
          onChange={(event) => {
            const nextType = event.target.value as CustomerDocumentType;
            if (!controlledType) setInternalType(nextType);
            onDocumentTypeChange?.(nextType);
            const nextDocument = formatDocumentInput(currentDocument, nextType);
            if (!controlledDocument) setInternalDocument(nextDocument);
            onDocumentChange?.(nextDocument);
          }}
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="cpf">CPF</option>
          <option value="cnpj">CNPJ</option>
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor={documentName}>{type.toUpperCase()} {required && "*"}</Label>
        <Input
          id={documentName}
          name={documentName}
          value={currentDocument}
          disabled={disabled}
          required={required}
          onChange={(event) => {
            const nextDocument = formatDocumentInput(event.target.value, type);
            if (!controlledDocument) setInternalDocument(nextDocument);
            onDocumentChange?.(nextDocument);
          }}
        />
      </div>
      {maskedDocument && (
        <div className="col-span-full flex justify-end">
          <Button type="button" variant="outline" onClick={() => {
            setInternalType(defaultDocumentType);
            setInternalDocument("");
            setIsDocumentEditing(false);
          }}>Cancelar</Button>
        </div>
      )}
    </div>
  );
}
