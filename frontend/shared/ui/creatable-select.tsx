"use client"

import * as React from "react"
import { Check, ChevronsUpDown, Plus } from "lucide-react"

import { cn } from "@/shared/lib/utils"
import { Button } from "@/shared/ui/button"
import { Input } from "@/shared/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover"

interface CreatableSelectProps {
  value?: string
  onChange?: (value: string) => void
  options: string[]
  placeholder?: string
  createLabel?: string
  className?: string
  disabled?: boolean
  "data-testid"?: string
}

export function CreatableSelect({
  value,
  onChange,
  options,
  placeholder = "Selecione uma opção",
  createLabel = "Criar novo",
  className,
  disabled,
  "data-testid": dataTestId,
}: CreatableSelectProps) {
  const [open, setOpen] = React.useState(false)
  const [searchValue, setSearchValue] = React.useState("")
  
  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options
    return options.filter((option) =>
      option.toLowerCase().includes(searchValue.toLowerCase())
    )
  }, [options, searchValue])

  const handleSelect = (selectedValue: string) => {
    onChange?.(selectedValue)
    setSearchValue("")
    setOpen(false)
  }

  const handleCreateNew = () => {
    if (searchValue.trim()) {
      onChange?.(searchValue.trim())
      setSearchValue("")
      setOpen(false)
    }
  }

  const showCreateOption = searchValue.trim() && 
    !options.some(opt => opt.toLowerCase() === searchValue.toLowerCase().trim())

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "w-full justify-between font-normal border-input hover:bg-accent/50",
            !value && "text-muted-foreground",
            className
          )}
          data-testid={dataTestId}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b border-border">
          <Input
            placeholder="Buscar ou criar..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="h-8"
            autoFocus
            data-testid="input-creatable-search"
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filteredOptions.length === 0 && !showCreateOption && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma opção encontrada
            </div>
          )}
          {filteredOptions.map((option) => (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              className={cn(
                "relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                value === option && "bg-accent"
              )}
              data-testid={`option-${option}`}
            >
              <Check
                className={cn(
                  "mr-2 h-4 w-4",
                  value === option ? "opacity-100 text-primary" : "opacity-0"
                )}
              />
              {option}
            </button>
          ))}
          {showCreateOption && (
            <button
              onClick={handleCreateNew}
              className="relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-2 text-sm outline-none hover:bg-primary/10 text-primary"
              data-testid="button-create-new"
            >
              <Plus className="mr-2 h-4 w-4" />
              {createLabel}: "{searchValue.trim()}"
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
