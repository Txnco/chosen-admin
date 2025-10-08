import React, { useState, useRef, useEffect } from 'react';

interface DateTimePickerProps {
  value: string; // ISO string
  onChange: (isoString: string) => void;
  label?: string;
  disabled?: boolean;
}

// Helper functions
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

const formatTwoDigits = (num: number) => {
  return num.toString().padStart(2, '0');
};

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const DateTimePicker: React.FC<DateTimePickerProps> = ({ 
  value, 
  onChange, 
  label,
  disabled = false 
}) => {
  const parseDate = (isoString: string) => {
    const date = new Date(isoString);
    return {
      year: date.getFullYear(),
      month: date.getMonth(),
      day: date.getDate(),
      hours: date.getHours(),
      minutes: date.getMinutes()
    };
  };

  const initialDate = value ? parseDate(value) : {
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    day: new Date().getDate(),
    hours: 9,
    minutes: 0
  };

  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(initialDate.month);
  const [viewYear, setViewYear] = useState(initialDate.year);
  const [selectedDay, setSelectedDay] = useState(initialDate.day);
  const [selectedMonth, setSelectedMonth] = useState(initialDate.month);
  const [selectedYear, setSelectedYear] = useState(initialDate.year);
  const [hours, setHours] = useState(initialDate.hours);
  const [minutes, setMinutes] = useState(initialDate.minutes);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      const parsed = parseDate(value);
      setSelectedDay(parsed.day);
      setSelectedMonth(parsed.month);
      setSelectedYear(parsed.year);
      setViewMonth(parsed.month);
      setViewYear(parsed.year);
      setHours(parsed.hours);
      setMinutes(parsed.minutes);
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const updateDateTime = (day?: number, month?: number, year?: number, hrs?: number, mins?: number) => {
    const d = day ?? selectedDay;
    const m = month ?? selectedMonth;
    const y = year ?? selectedYear;
    const h = hrs ?? hours;
    const min = mins ?? minutes;

    const date = new Date(y, m, d, h, min);
    onChange(date.toISOString());
  };

  const handleDateSelect = (day: number) => {
    setSelectedDay(day);
    setSelectedMonth(viewMonth);
    setSelectedYear(viewYear);
    updateDateTime(day, viewMonth, viewYear, hours, minutes);
  };

  const handleTimeChange = (newHours: number, newMinutes: number) => {
    setHours(newHours);
    setMinutes(newMinutes);
    updateDateTime(selectedDay, selectedMonth, selectedYear, newHours, newMinutes);
  };

  const incrementMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const decrementMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const incrementHours = () => {
    const newHours = (hours + 1) % 24;
    handleTimeChange(newHours, minutes);
  };

  const decrementHours = () => {
    const newHours = hours === 0 ? 23 : hours - 1;
    handleTimeChange(newHours, minutes);
  };

  const incrementMinutes = () => {
    const newMinutes = (minutes + 15) % 60;
    handleTimeChange(hours, newMinutes);
  };

  const decrementMinutes = () => {
    const newMinutes = minutes === 0 ? 45 : minutes - 15;
    handleTimeChange(hours, newMinutes);
  };

  const setToNow = () => {
    const now = new Date();
    setSelectedDay(now.getDate());
    setSelectedMonth(now.getMonth());
    setSelectedYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setViewYear(now.getFullYear());
    setHours(now.getHours());
    setMinutes(now.getMinutes());
    onChange(now.toISOString());
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const paddingDays = firstDay === 0 ? 6 : firstDay - 1;

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() && 
           viewMonth === today.getMonth() && 
           viewYear === today.getFullYear();
  };

  const isSelected = (day: number) => {
    return day === selectedDay && 
           viewMonth === selectedMonth && 
           viewYear === selectedYear;
  };

  const displayValue = value 
    ? `${monthNames[selectedMonth].slice(0, 3)} ${formatTwoDigits(selectedDay)}, ${selectedYear} ${formatTwoDigits(hours)}:${formatTwoDigits(minutes)}`
    : 'Select date & time';

  return (
    <div className="relative" ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-black focus:border-black disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
      >
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-900">{displayValue}</span>
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl w-80">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <button
              type="button"
              onClick={decrementMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <span className="font-semibold text-sm">
              {monthNames[viewMonth]} {viewYear}
            </span>
            
            <button
              type="button"
              onClick={incrementMonth}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {/* Padding days */}
              {Array.from({ length: paddingDays }).map((_, idx) => (
                <div key={`pad-${idx}`} className="aspect-square" />
              ))}
              
              {/* Actual days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const day = idx + 1;
                const selected = isSelected(day);
                const today = isToday(day);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleDateSelect(day)}
                    className={`
                      aspect-square flex items-center justify-center text-sm rounded-md transition-colors
                      ${selected 
                        ? 'bg-black text-white font-semibold' 
                        : today 
                          ? 'bg-blue-100 text-blue-900 font-semibold'
                          : 'hover:bg-gray-100'
                      }
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time Picker */}
          <div className="border-t p-4">
            <div className="flex items-center justify-center gap-4">
              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              
              {/* Hours */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={incrementHours}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                
                <input
                  type="number"
                  min="0"
                  max="23"
                  value={formatTwoDigits(hours)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 23) {
                      handleTimeChange(val, minutes);
                    }
                  }}
                  className="w-16 text-center text-2xl font-bold border-b-2 border-gray-300 focus:border-black outline-none py-2"
                />
                
                <button
                  type="button"
                  onClick={decrementHours}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>

              <span className="text-2xl font-bold">:</span>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <button
                  type="button"
                  onClick={incrementMinutes}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="15"
                  value={formatTwoDigits(minutes)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (!isNaN(val) && val >= 0 && val <= 59) {
                      handleTimeChange(hours, val);
                    }
                  }}
                  className="w-16 text-center text-2xl font-bold border-b-2 border-gray-300 focus:border-black outline-none py-2"
                />
                
                <button
                  type="button"
                  onClick={decrementMinutes}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="text-center mt-3 text-xs text-gray-500">
              24-hour format
            </div>
          </div>

          {/* Action buttons */}
          <div className="border-t p-3 flex gap-2">
            <button
              type="button"
              onClick={setToNow}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="flex-1 px-3 py-2 text-sm font-medium text-white bg-black hover:bg-gray-800 rounded-md transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};