import React, { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';
import { Calendar as CalendarComponent } from './calendar';
import { format, subDays, subMonths, subYears, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface DateRangePickerProps {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  placeholder?: string;
}

type PresetType = 'lastWeek' | 'lastMonth' | 'lastYear' | 'custom';

interface DatePreset {
  label: string;
  value: PresetType;
  getRange: () => DateRange;
}

const datePresets: DatePreset[] = [
  {
    label: 'Last Week',
    value: 'lastWeek',
    getRange: () => {
      const today = new Date();
      const lastWeek = subDays(today, 7);
      return {
        from: startOfWeek(lastWeek, { weekStartsOn: 1 }),
        to: endOfWeek(lastWeek, { weekStartsOn: 1 })
      };
    }
  },
  {
    label: 'Last Month',
    value: 'lastMonth',
    getRange: () => {
      const today = new Date();
      const lastMonth = subMonths(today, 1);
      return {
        from: startOfMonth(lastMonth),
        to: endOfMonth(lastMonth)
      };
    }
  },
  {
    label: 'Last Year',
    value: 'lastYear',
    getRange: () => {
      const today = new Date();
      const lastYear = subYears(today, 1);
      return {
        from: startOfYear(lastYear),
        to: endOfYear(lastYear)
      };
    }
  },
  {
    label: 'Custom',
    value: 'custom',
    getRange: () => ({ from: undefined, to: undefined })
  }
];

export function DateRangePicker({ value, onChange, placeholder = "Select dates" }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<PresetType>('custom');
  const [customRange, setCustomRange] = useState<DateRange | undefined>(value);

  // Sync customRange with value prop when it changes
  React.useEffect(() => {
    setCustomRange(value);
  }, [value]);

  const formatDateRange = (range?: DateRange) => {
    if (!range?.from && !range?.to) return placeholder;
    if (range.from && range.to) {
      return `${format(range.from, "MMM dd")} - ${format(range.to, "MMM dd")}`;
    }
    if (range.from) {
      return `From ${format(range.from, "MMM dd, yyyy")}`;
    }
    if (range.to) {
      return `Until ${format(range.to, "MMM dd, yyyy")}`;
    }
    return placeholder;
  };

  const handlePresetSelect = (preset: DatePreset) => {
    setSelectedPreset(preset.value);
    
    if (preset.value === 'custom') {
      // Keep current custom range or clear it
      const rangeToUse = customRange || { from: undefined, to: undefined };
      onChange?.(rangeToUse);
    } else {
      const range = preset.getRange();
      onChange?.(range);
      setIsOpen(false);
    }
  };

  const handleCustomDateSelect = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (selectedPreset === 'custom') {
      onChange?.(range);
      if (range?.from && range?.to) {
        setIsOpen(false);
      }
    }
  };

  const handleApply = () => {
    if (selectedPreset === 'custom') {
      onChange?.(customRange);
    }
    setIsOpen(false);
  };

  const handleClear = () => {
    setCustomRange(undefined);
    setSelectedPreset('custom');
    onChange?.(undefined);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative inline-block overflow-hidden">
          <Button
            variant="outline"
            className="justify-start text-left font-normal pr-10"
          >
            <Calendar className="mr-2 h-4 w-4" />
            {formatDateRange(value)}
          </Button>
          {value?.from && (
            <button
              type="button"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-50 hover:opacity-100 cursor-pointer flex items-center justify-center rounded-sm hover:bg-muted"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClear();
              }}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Preset Options */}
          <div className="border-r bg-muted/20 p-3 min-w-[140px]">
            <div className="space-y-1">
              {datePresets.map((preset) => (
                <Button
                  key={preset.value}
                  variant={selectedPreset === preset.value ? "default" : "ghost"}
                  className="w-full justify-start text-sm h-8"
                  onClick={() => handlePresetSelect(preset)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
            {selectedPreset === 'custom' && (
              <div className="mt-4 pt-3 border-t space-y-2">
                <Button
                  onClick={handleApply}
                  className="w-full text-sm h-8"
                  size="sm"
                >
                  Apply
                </Button>
                <Button
                  onClick={handleClear}
                  variant="outline"
                  className="w-full text-sm h-8"
                  size="sm"
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
          
          {/* Calendar */}
          <div className="p-3">
            <CalendarComponent
              mode="range"
              selected={selectedPreset === 'custom' ? customRange : value}
              onSelect={handleCustomDateSelect}
              numberOfMonths={1}
              disabled={selectedPreset !== 'custom'}
              classNames={{
                day_selected: "bg-blue-500 text-white hover:bg-blue-600 hover:text-white focus:bg-blue-600 focus:text-white",
                day_range_middle: "aria-selected:bg-blue-100 aria-selected:text-blue-900",
                day_range_start: "bg-blue-500 text-white hover:bg-blue-600",
                day_range_end: "bg-blue-500 text-white hover:bg-blue-600"
              }}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}