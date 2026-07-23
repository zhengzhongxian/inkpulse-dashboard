import React, { useState, useEffect, useRef } from 'react';
import { TbChevronLeft, TbChevronRight, TbCalendar, TbX } from 'react-icons/tb';

interface CustomDateTimePickerProps {
  value: string; // YYYY-MM-DDTHH:mm format
  onChange: (dateTime: string) => void;
  placeholder: string;
  align?: 'left' | 'right';
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  value,
  onChange,
  placeholder,
  align = 'left'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date-time: expected format "YYYY-MM-DDTHH:mm"
  // Fallback to current date-time
  const parseValue = (val: string) => {
    if (!val) return { dateStr: '', hour: 0, minute: 0 };
    const parts = val.split('T');
    const dateStr = parts[0] || '';
    const timeStr = parts[1] || '00:00';
    const [h, m] = timeStr.split(':').map(Number);
    return { dateStr, hour: isNaN(h) ? 0 : h, minute: isNaN(m) ? 0 : m };
  };

  const { dateStr, hour, minute } = parseValue(value);

  const initialDate = dateStr ? new Date(dateStr) : new Date();
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [selectedDate, setSelectedDate] = useState(dateStr);
  const [selectedHour, setSelectedHour] = useState(hour);
  const [selectedMinute, setSelectedMinute] = useState(minute);

  useEffect(() => {
    const parsed = parseValue(value);
    if (parsed.dateStr) {
      setSelectedDate(parsed.dateStr);
      const d = new Date(parsed.dateStr);
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
    } else {
      setSelectedDate('');
    }
    setSelectedHour(parsed.hour);
    setSelectedMinute(parsed.minute);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const months = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];
  const weekdays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(prev => prev - 1);
    } else {
      setViewMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(prev => prev + 1);
    } else {
      setViewMonth(prev => prev + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    const newDateStr = `${viewYear}-${m}-${d}`;
    setSelectedDate(newDateStr);
    
    // Update value reactively
    const hr = String(selectedHour).padStart(2, '0');
    const min = String(selectedMinute).padStart(2, '0');
    onChange(`${newDateStr}T${hr}:${min}`);
  };

  const handleTimeChange = (h: number, m: number) => {
    setSelectedHour(h);
    setSelectedMinute(m);
    
    if (selectedDate) {
      const hr = String(h).padStart(2, '0');
      const min = String(m).padStart(2, '0');
      onChange(`${selectedDate}T${hr}:${min}`);
    } else {
      // If no date selected yet, default to today
      const today = new Date();
      const yr = today.getFullYear();
      const mth = String(today.getMonth() + 1).padStart(2, '0');
      const dy = String(today.getDate()).padStart(2, '0');
      const hr = String(h).padStart(2, '0');
      const min = String(m).padStart(2, '0');
      const newDateStr = `${yr}-${mth}-${dy}`;
      setSelectedDate(newDateStr);
      onChange(`${newDateStr}T${hr}:${min}`);
    }
  };

  const handleConfirm = () => {
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const formatDateDisplay = (dateTimeStr: string) => {
    if (!dateTimeStr) return placeholder;
    const parts = dateTimeStr.split('T');
    const dStr = parts[0] || '';
    const tStr = parts[1] || '00:00';
    if (!dStr) return placeholder;
    
    const [y, m, d] = dStr.split('-');
    return `${d}/${m}/${y} ${tStr}`;
  };

  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = 2020; y <= currentYear + 5; y++) {
    yearOptions.push(y);
  }

  return (
    <div className="custom-datetimepicker-container" ref={containerRef} style={{ position: 'relative', width: '210px', userSelect: 'none' }}>
      <div
        className={`custom-datepicker-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1a1a1a',
          border: isOpen ? '2px solid #4a4a4f' : '2px solid var(--border)',
          borderRadius: '10px',
          padding: '0 12px',
          height: '44px',
          color: value ? '#FFFFFF' : 'var(--text-light)',
          fontSize: '13.5px',
          fontWeight: value ? '600' : '500',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        <span>{formatDateDisplay(value)}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {value && (
            <button
              type="button"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-light)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '14px',
                borderRadius: '50%',
                transition: 'var(--transition)'
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--primary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-light)';
              }}
            >
              <TbX />
            </button>
          )}
          <TbCalendar style={{ color: 'var(--primary)', fontSize: '16px', flexShrink: 0 }} />
        </div>
      </div>

      {isOpen && (
        <div
          className="custom-datepicker-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: align === 'right' ? 'auto' : '0',
            right: align === 'right' ? '0' : 'auto',
            width: '280px',
            zIndex: 150,
            backgroundColor: '#16161a',
            border: '1px solid #2a2a2e',
            borderRadius: '10px',
            padding: '16px',
            marginTop: '4px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            boxSizing: 'border-box'
          }}
        >
          {/* Header navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', gap: '4px' }}>
            <button
              type="button"
              onClick={handlePrevMonth}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--primary)',
                transition: 'all 0.15s ease'
              }}
            >
              <TbChevronLeft style={{ fontSize: '18px' }} />
            </button>

            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2e',
                  color: '#ffffff',
                  fontSize: '13px',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  fontWeight: '600'
                }}
              >
                {months.map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
              <select
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
                style={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #2a2a2e',
                  color: '#ffffff',
                  fontSize: '13px',
                  padding: '4px 6px',
                  borderRadius: '6px',
                  outline: 'none',
                  cursor: 'pointer',
                  fontFamily: 'var(--font)',
                  fontWeight: '600'
                }}
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                color: 'var(--primary)',
                transition: 'all 0.15s ease'
              }}
            >
              <TbChevronRight style={{ fontSize: '18px' }} />
            </button>
          </div>

          {/* Weekdays */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontWeight: '700', fontSize: '11px', color: 'var(--text-light)', marginBottom: '8px', fontFamily: 'var(--font)' }}>
            {weekdays.map(d => <div key={d}>{d}</div>)}
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center', marginBottom: '14px' }}>
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ height: '28px' }}></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected = selectedDate &&
                new Date(selectedDate).getDate() === day &&
                new Date(selectedDate).getMonth() === viewMonth &&
                new Date(selectedDate).getFullYear() === viewYear;

              return (
                <div
                  key={day}
                  onClick={() => handleSelectDay(day)}
                  style={{
                    height: '28px',
                    lineHeight: '28px',
                    fontSize: '12.5px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    color: isSelected ? '#FFFFFF' : '#e2e8f0',
                    background: isSelected ? 'linear-gradient(135deg, #da447d, #b83469)' : 'transparent',
                    fontWeight: isSelected ? '700' : '500',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'rgba(246, 173, 85, 0.1)';
                      e.currentTarget.style.color = '#f6ad55';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#e2e8f0';
                    }
                  }}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* Time Selector Area */}
          <div style={{ borderTop: '1px solid #2a2a2e', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>Thời gian:</span>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <select
                  value={selectedHour}
                  onChange={(e) => handleTimeChange(Number(e.target.value), selectedMinute)}
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2e',
                    color: '#ffffff',
                    fontSize: '13px',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    fontWeight: '600',
                    width: '50px'
                  }}
                >
                  {Array.from({ length: 24 }).map((_, h) => (
                    <option key={h} value={h}>{String(h).padStart(2, '0')}</option>
                  ))}
                </select>
                <span style={{ color: '#ffffff', fontWeight: 700 }}>:</span>
                <select
                  value={selectedMinute}
                  onChange={(e) => handleTimeChange(selectedHour, Number(e.target.value))}
                  style={{
                    backgroundColor: '#1a1a1a',
                    border: '1px solid #2a2a2e',
                    color: '#ffffff',
                    fontSize: '13px',
                    padding: '4px 6px',
                    borderRadius: '6px',
                    outline: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font)',
                    fontWeight: '600',
                    width: '50px'
                  }}
                >
                  {Array.from({ length: 60 }).map((_, m) => (
                    <option key={m} value={m}>{String(m).padStart(2, '0')}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  background: 'linear-gradient(135deg, #da447d, #b83469)',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: '700',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.filter = 'none';
                }}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
