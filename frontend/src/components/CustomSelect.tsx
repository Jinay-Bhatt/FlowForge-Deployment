'use client';
import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  badge?: string;
  badgeColor?: string;
  method?: string;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (CustomSelectOption | string)[];
  style?: React.CSSProperties;
  className?: string;
}

const METHOD_COLORS: Record<string, string> = {
  GET: '#10b981',
  POST: '#6366f1',
  PUT: '#f59e0b',
  DELETE: '#ef4444',
  PATCH: '#38bdf8',
};

export default function CustomSelect({ value, onChange, options, style, className }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'string') {
      const parts = opt.split(' ');
      const possibleMethod = parts[0];
      const isMethod = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(possibleMethod);
      return {
        value: opt,
        label: opt,
        method: isMethod ? possibleMethod : undefined,
      };
    }
    return opt;
  });

  const selectedOption = normalizedOptions.find((opt) => opt.value === value) || normalizedOptions[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const renderOptionContent = (opt: CustomSelectOption) => {
    if (opt.method) {
      const color = METHOD_COLORS[opt.method] || '#6366f1';
      // If label starts with the method name, strip it to show clean layout
      const displayLabel = opt.label.startsWith(opt.method)
        ? opt.label.substring(opt.method.length).trim()
        : opt.label;

      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color,
              background: `${color}15`,
              border: `1.5px solid ${color}35`,
              borderRadius: 4,
              padding: '1px 6px',
              fontFamily: "'JetBrains Mono', monospace",
              flexShrink: 0,
            }}
          >
            {opt.method}
          </span>
          <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {displayLabel}
          </span>
          {opt.badge && (
            <span
              style={{
                fontSize: 9,
                fontWeight: 650,
                color: opt.badgeColor || '#05ffc4',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '1px 5px',
                borderRadius: 3,
                marginLeft: 'auto',
                flexShrink: 0,
              }}
            >
              {opt.badge}
            </span>
          )}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
        <span style={{ flex: 1, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
          {opt.label}
        </span>
        {opt.badge && (
          <span
            style={{
              fontSize: 9,
              fontWeight: 650,
              color: opt.badgeColor || '#05ffc4',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              padding: '1px 5px',
              borderRadius: 3,
              flexShrink: 0,
            }}
          >
            {opt.badge}
          </span>
        )}
      </div>
    );
  };

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: 'relative',
        display: 'inline-block',
        width: '100%',
        fontFamily: "'JetBrains Mono', monospace",
        userSelect: 'none',
        ...style,
      }}
    >
      {/* Selector Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          background: isOpen ? 'var(--neu-sunken)' : 'var(--neu-surface)',
          border: '1px solid var(--neu-border)',
          padding: '10px 14px',
          color: '#f1f5f9',
          fontSize: 13,
          outline: 'none',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 10,
          textAlign: 'left',
          borderRadius: 10,
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: isOpen ? 'var(--neu-pressed-sm)' : 'var(--neu-flat-xs)',
          borderColor: isOpen ? 'rgba(99,102,241,0.4)' : 'var(--neu-border)',
        }}
      >
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          {selectedOption ? renderOptionContent(selectedOption) : <span style={{ color: 'var(--text-faint)' }}>Select...</span>}
        </div>
        <ChevronDown
          size={14}
          style={{
            color: 'var(--text-muted)',
            transition: 'transform 0.25s',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
            flexShrink: 0,
          }}
        />
      </button>

      {/* Options Dropdown Menu */}
      {isOpen && (
        <div
          className="scroll-area"
          style={{
            position: 'absolute',
            zIndex: 9999,
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 8,
            background: 'var(--neu-surface)',
            border: '1px solid var(--neu-border-bevel)',
            borderRadius: 12,
            boxShadow: 'var(--neu-flat-lg)',
            maxHeight: 220,
            overflowY: 'auto',
            padding: 6,
            animation: 'scaleIn 0.18s cubic-bezier(0.34, 1.56, 0.64, 1) both',
          }}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = selectedOption?.value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: isSelected ? 'var(--neu-sunken)' : 'transparent',
                  border: isSelected ? '1px solid rgba(255, 255, 255, 0.18)' : '1px solid transparent',
                  boxShadow: isSelected ? 'var(--neu-pressed-sm)' : 'none',
                  borderRadius: 8,
                  padding: '9px 12px',
                  color: isSelected ? '#fff' : '#94a3b8',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'all 0.15s ease',
                  marginBottom: 3,
                  outline: 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                    e.currentTarget.style.color = '#fff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#94a3b8';
                  }
                }}
              >
                {renderOptionContent(opt)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
