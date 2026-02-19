"use client"

import React from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { Calendar, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface DateTimePickerProps {
  selected: Date | null
  onChange: (date: Date | null) => void
  placeholderText?: string
  minDate?: Date
  disabled?: boolean
  required?: boolean
  showTimeSelect?: boolean
  dateFormat?: string
  timeIntervals?: number
  className?: string
}

export function DateTimePicker({
  selected,
  onChange,
  placeholderText = "Select date and time",
  minDate,
  disabled = false,
  required = false,
  showTimeSelect = true,
  dateFormat = "MMM d, yyyy h:mm aa",
  timeIntervals = 15,
  className,
}: DateTimePickerProps) {
  return (
    <div className="relative">
      <DatePicker
        selected={selected}
        onChange={onChange}
        showTimeSelect={showTimeSelect}
        timeIntervals={timeIntervals}
        dateFormat={dateFormat}
        placeholderText={placeholderText}
        minDate={minDate}
        disabled={disabled}
        required={required}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        wrapperClassName="w-full"
        calendarClassName="!font-sans"
      />
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none flex gap-1 text-muted-foreground">
        <Calendar className="h-4 w-4" />
        {showTimeSelect && <Clock className="h-4 w-4" />}
      </div>
    </div>
  )
}
