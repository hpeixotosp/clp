"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isAfter, startOfWeek, endOfWeek } from "date-fns"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export interface CalendarProps {
  mode?: "single" | "multiple" | "range"
  selected?: Date | Date[] | undefined
  onSelect?: (date: Date | undefined) => void
  disabled?: { before?: Date; after?: Date }
  className?: string
  captionLayout?: "buttons" | "dropdown"
}

function Calendar({
  mode = "single",
  selected,
  onSelect,
  disabled,
  className,
  captionLayout = "dropdown"
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date())
  
  // Sempre força apenas 1 mês e desabilita datas futuras
  const forcedDisabled = { after: new Date() }
  const effectiveDisabled = { ...forcedDisabled, ...disabled }

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1))
  }

  const goToNextMonth = () => {
    const nextMonth = addMonths(currentMonth, 1)
    // Não permite ir para meses futuros
    if (!isAfter(nextMonth, new Date())) {
      setCurrentMonth(nextMonth)
    }
  }

  const handleDateClick = (date: Date) => {
    if (onSelect) {
      onSelect(date)
    }
  }

  const isDateDisabled = (date: Date) => {
    if (effectiveDisabled.before && date < effectiveDisabled.before) return true
    if (effectiveDisabled.after && date > effectiveDisabled.after) return true
    return false
  }

  const isDateSelected = (date: Date) => {
    if (!selected) return false
    if (Array.isArray(selected)) {
      return selected.some(selectedDate => isSameDay(date, selectedDate))
    }
    return isSameDay(date, selected)
  }

  // Gera os dias do mês atual
  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  return (
    <div className={cn("p-3", className)}>
      {/* Header do calendário */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        <div className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy", { locale: ptBR })}
        </div>
        
        <button
          onClick={goToNextMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div
            key={day}
            className="text-muted-foreground text-center text-xs font-medium w-9"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isDisabled = isDateDisabled(day)
          const isSelected = isDateSelected(day)
          const isCurrentDay = isToday(day)

          return (
            <button
              key={index}
              onClick={() => handleDateClick(day)}
              disabled={isDisabled}
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-9 w-9 p-0 font-normal",
                !isCurrentMonth && "text-muted-foreground opacity-50",
                isDisabled && "text-muted-foreground opacity-50 cursor-not-allowed",
                isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                isCurrentDay && !isSelected && "bg-accent text-accent-foreground",
                "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
              )}
            >
              {format(day, "d")}
            </button>
          )
        })}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
