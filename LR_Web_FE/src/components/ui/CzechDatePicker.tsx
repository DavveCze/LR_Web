import React, { useRef } from 'react';

interface DatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

/**
 * Převede YYYY-MM-DD na DD.MM.YYYY
 */
function toDisplayFormat(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}.${month}.${year}`;
  }
  return isoDate;
}

/**
 * Převede DD.MM.YYYY nebo D.M.YYYY nebo DD/MM/YYYY na YYYY-MM-DD
 */
function toIsoFormat(displayDate: string): string {
  if (!displayDate) return '';
  // Nahradíme lomítka a pomlčky tečkami
  const clean = displayDate.replace(/[/\\-]/g, '.').trim();
  const match = clean.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (match) {
    const day = match[1].padStart(2, '0');
    const month = match[2].padStart(2, '0');
    const year = match[3];
    return `${year}-${month}-${day}`;
  }
  return '';
}

/**
 * Komponenta pro datum ve formátu DD.MM.RRRR (dd/mm/yyyy).
 * Umožňuje přímý zápis v českém formátu (DD.MM.RRRR) i otevření vestavěného kalendáře
 * přes ikonu, přičemž do stavu ukládá standardní YYYY-MM-DD.
 */
export const CzechDatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  required = false,
  className = '',
  placeholder = 'DD.MM.RRRR',
  disabled = false,
  id,
}) => {
  const [textValue, setTextValue] = React.useState<string>(toDisplayFormat(value));
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Synchronizace při externí změně value
  React.useEffect(() => {
    setTextValue(toDisplayFormat(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setTextValue(raw);

    const iso = toIsoFormat(raw);
    if (iso) {
      onChange(iso);
    } else if (raw === '') {
      onChange('');
    }
  };

  const handleBlur = () => {
    // Při opuštění pole: pokud je text nevalidní, vrátíme poslední platnou hodnotu
    const iso = toIsoFormat(textValue);
    if (iso) {
      setTextValue(toDisplayFormat(iso));
      onChange(iso);
    } else if (textValue.trim() === '') {
      setTextValue('');
      onChange('');
    } else {
      // Obnovit předchozí platnou
      setTextValue(toDisplayFormat(value));
    }
  };

  const handleCalendarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newIso = e.target.value;
    onChange(newIso);
    setTextValue(toDisplayFormat(newIso));
  };

  const openCalendar = () => {
    if (hiddenInputRef.current) {
      if ('showPicker' in HTMLInputElement.prototype) {
        hiddenInputRef.current.showPicker();
      } else {
        hiddenInputRef.current.focus();
      }
    }
  };

  return (
    <div className={`relative inline-flex items-center w-full ${className}`}>
      {/* Vizuální textový input pro formát DD.MM.RRRR */}
      <input
        type="text"
        id={id}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={textValue}
        onChange={handleTextChange}
        onBlur={handleBlur}
        className="w-full rounded border border-neutral-300 bg-white p-2 pr-9 text-sm text-neutral-800 placeholder-neutral-400 focus:border-neutral-500 focus:outline-none"
      />

      {/* Tlačítko kalendáře */}
      <button
        type="button"
        tabIndex={-1}
        onClick={openCalendar}
        disabled={disabled}
        aria-label="Otevřít kalendář"
        className="absolute right-2 text-neutral-400 hover:text-neutral-700 p-1 cursor-pointer"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {/* Skrytý nativní date input pro vyvolání kalendáře */}
      <input
        ref={hiddenInputRef}
        type="date"
        value={value || ''}
        onChange={handleCalendarChange}
        tabIndex={-1}
        className="absolute bottom-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
      />
    </div>
  );
};
