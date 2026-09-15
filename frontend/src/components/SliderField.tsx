import './SliderField.css';

export interface SliderFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string; // e.g. "%" or "yrs" — displayed after the value
  onChange: (value: number) => void;
}

export function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
}: SliderFieldProps) {
  return (
    <div className="slider-field">
      <div className="slider-field__row">
        <label className="slider-field__label">{label}</label>
        <span className="slider-field__value mono">
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  );
}
