"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Calendar } from "@/shared/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"

interface DatePickerProps {
  value?: Date | string
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  "data-testid"?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  className,
  disabled,
  minDate,
  "data-testid": dataTestId,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    return new Date(value)
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "justify-start text-left font-normal border-primary/30 hover:border-primary/60 hover:bg-primary/5",
            !dateValue && "text-muted-foreground",
            className
          )}
          data-testid={dataTestId}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          {dateValue ? format(dateValue, "dd/MM/yyyy", { locale: ptBR }) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-primary/30" align="start">
        <Calendar
          mode="single"
          selected={dateValue}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          disabled={minDate ? (date) => date < minDate : undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
