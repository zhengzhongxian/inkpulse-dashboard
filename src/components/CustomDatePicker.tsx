import React, { useState, useEffect, useRef } from 'react';
import { TbChevronLeft, TbChevronRight, TbCalendar, TbX } from 'react-icons/tb';

interface CustomDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  placeholder: string;
}

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  value,
  onChange,
  placeholder
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial date or default to current date
  const initialDate = value ? new Date(value) : new Date();
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      setViewMonth(d.getMonth());
      setViewYear(d.getFullYear());
    }
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
    onChange(`${viewYear}-${m}-${d}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return placeholder;
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  // Generate year options (from 2020 to current + 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions: number[] = [];
  for (let y = 2020; y <= currentYear + 5; y++) {
    yearOptions.push(y);
  }

  return (
    <div className="custom-datepicker-container" ref={containerRef} style={{ position: 'relative', width: '170px', userSelect: 'none' }}>
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
            left: '0',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', textAlign: 'center' }}>
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} style={{ height: '28px' }}></div>
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected = value &&
                new Date(value).getDate() === day &&
                new Date(value).getMonth() === viewMonth &&
                new Date(value).getFullYear() === viewYear;

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
                      e.currentTarget.style.backgroundColor = 'rgba(246, 135, 179, 0.1)';
                      e.currentTarget.style.color = '#F687B3';
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
        </div>
      )}
    </div>
  );
};
