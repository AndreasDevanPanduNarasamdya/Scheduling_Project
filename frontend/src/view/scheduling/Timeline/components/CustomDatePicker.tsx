import { useState, useRef, useEffect } from "react";

interface BlockedRange {
  startDate: string;
  endDate: string;
}

interface BlockedDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  blockedRanges: BlockedRange[];
  minDate?: string;
  placeholder?: string;
  className?: string;
}

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
const DAY_NAMES = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function formatDateDisplay(dateStr: string) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  
  const year = parts[0];
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  
  return `${day} ${MONTH_NAMES[month]} ${year}`;
}

function toKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export default function BlockedDatePicker({ value, onChange, blockedRanges, minDate, placeholder, className }: BlockedDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => (value ? new Date(value) : new Date()));
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

    const isBlocked = (d: Date) => {
      const t = d.getTime();
      return blockedRanges.some(r => {
        const rs = parseLocalDate(r.startDate).getTime();
        const re = parseLocalDate(r.endDate).getTime();
        return t >= rs && t <= re;
      });
    };

    const isBeforeMin = (d: Date) => {
    if (!minDate) return false;
    return d.getTime() < parseLocalDate(minDate).getTime();
    };

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = firstDayOfMonth.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const selectedKey = value || "";

return (
    <div className="relative w-full" ref={wrapperRef}>
      <input
        type="text"
        readOnly
        placeholder={placeholder}
        className={className || "input-field cursor-pointer text-black/80 text-sm py-1.5"}
        value={value ? formatDateDisplay(value) : ""}
        onClick={() => setIsOpen(o => !o)}
      />

    {isOpen && (
      <div className="absolute z-50 mt-1 bg-white border border-brand-outline rounded-lg shadow-lg p-2 w-56">
        <div className="flex items-center justify-between mb-1.5">
          <button
            type="button"
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 text-black/50 cursor-pointer text-xs"
            onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          >
            ‹
          </button>
          <span className="text-xs font-bold text-black/80">{MONTH_NAMES[month]} {year}</span>
          <button
            type="button"
            className="w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 text-black/50 cursor-pointer text-xs"
            onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-0.5 mb-0.5">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-[9px] font-bold text-black/40 text-center py-0.5">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((d, idx) => {
            if (!d) return <div key={idx} />;
            const key = toKey(d);
            const isSelected = key === selectedKey;
            const taken = isBlocked(d) && !isSelected; 
            const past = isBeforeMin(d) && !isSelected; 
            const isDisabled = taken || past;

            return (
              <button
                key={idx}
                type="button"
                disabled={isDisabled}
                onClick={() => { onChange(key); setIsOpen(false); }}
                className={`text-[11px] rounded-md py-1 transition leading-none ${
                  isSelected
                    ? "bg-brand-primary text-white font-bold cursor-pointer shadow-sm"
                    : taken
                    ? "text-black/30 line-through cursor-not-allowed bg-black/5"
                    : past
                    ? "text-black/20 cursor-not-allowed"
                    : "text-black/80 hover:bg-brand-bg cursor-pointer"
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>

        <div className="flex justify-between mt-1.5 pt-1.5 border-t border-brand-outline/40">
          <button type="button" className="text-[10px] text-black/50 hover:text-black cursor-pointer" onClick={() => { onChange(""); setIsOpen(false); }}>
            Clear
          </button>
          <button type="button" className="text-[10px] text-brand-primary font-semibold cursor-pointer" onClick={() => setViewMonth(new Date())}>
            Today
          </button>
        </div>
      </div>
    )}
  </div>
);
}