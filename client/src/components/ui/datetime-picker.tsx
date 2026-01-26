"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DateTimePickerProps {
  value?: Date | string
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDate?: Date
  "data-testid"?: string
}

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Selecione data e hora",
  className,
  disabled,
  minDate,
  "data-testid": dataTestId,
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false)
  
  const dateValue = React.useMemo(() => {
    if (!value) return undefined
    if (value instanceof Date) return value
    const parsed = new Date(value)
    if (isNaN(parsed.getTime())) return undefined
    return parsed
  }, [value])

  const [selectedTime, setSelectedTime] = React.useState("09:00")
  
  React.useEffect(() => {
    if (dateValue) {
      const hours = dateValue.getHours().toString().padStart(2, '0')
      const minutes = dateValue.getMinutes().toString().padStart(2, '0')
      setSelectedTime(`${hours}:${minutes}`)
    }
  }, [dateValue])

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = selectedTime.split(':').map(Number)
      const newDate = new Date(date)
      newDate.setHours(hours, minutes, 0, 0)
      onChange?.(newDate)
    } else {
      onChange?.(undefined)
    }
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    setSelectedTime(time)
    
    if (dateValue && time) {
      const [hours, minutes] = time.split(':').map(Number)
      const newDate = new Date(dateValue)
      newDate.setHours(hours, minutes, 0, 0)
      onChange?.(newDate)
    }
  }

  const formatDateTime = (date: Date) => {
    return format(date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal border-primary/30 hover:border-primary/60 hover:bg-primary/5",
            !dateValue && "text-muted-foreground",
            className
          )}
          data-testid={dataTestId}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
          {dateValue ? formatDateTime(dateValue) : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-primary/30" align="start">
        <div className="p-3 space-y-3">
          <Calendar
            mode="single"
            selected={dateValue}
            onSelect={handleDateSelect}
            disabled={minDate ? (date) => date < minDate : undefined}
            initialFocus
          />
          
          <div className="border-t border-border pt-3">
            <Label htmlFor="time-picker" className="text-sm font-medium flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              Horário Preferencial
            </Label>
            <Input
              id="time-picker"
              type="time"
              value={selectedTime}
              onChange={handleTimeChange}
              className="bg-background border-primary/30 focus:border-primary"
              data-testid="input-time-picker"
            />
          </div>
          
          <Button
            onClick={() => setOpen(false)}
            className="w-full bg-primary text-black hover:bg-primary/90"
            size="sm"
          >
            Confirmar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
