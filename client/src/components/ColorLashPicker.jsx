import React from 'react';

export default function ColorLashPicker({
  id = 'lash-color',
  selectedColor,
  onChange,
  colors,
  compact = false,
}) {
  const selected = colors.find((c) => c.value === selectedColor);

  return (
    <div className={`color-lash-picker${compact ? ' color-lash-picker--compact' : ''}`}>
      <label htmlFor={id} className="color-lash-picker__label">
        Choose your lash color
      </label>
      {!compact && (
        <p className="color-lash-picker__hint">
          Select your shade now — you can update it again in checkout.
        </p>
      )}
      <div className="color-lash-picker__control">
        {selected && (
          <span
            className="color-lash-picker__swatch color-lash-picker__swatch--preview"
            style={{ backgroundColor: selected.swatch }}
            aria-hidden
          />
        )}
        <select
          id={id}
          name="color"
          className="color-lash-picker__select"
          value={selectedColor}
          onChange={onChange}
        >
          <option value="">Select a color</option>
          {colors.map((color) => (
            <option key={color.value} value={color.value}>
              {color.label}
            </option>
          ))}
        </select>
      </div>
      <div className="color-lash-picker__palette" role="listbox" aria-label="Available lash colors">
        {colors.map((color) => (
          <button
            key={color.value}
            type="button"
            role="option"
            aria-selected={selectedColor === color.value}
            aria-label={color.label}
            className={`color-lash-picker__chip${selectedColor === color.value ? ' is-selected' : ''}`}
            style={{ backgroundColor: color.swatch }}
            onClick={() => onChange({ target: { name: 'color', value: color.value } })}
          />
        ))}
      </div>
    </div>
  );
}
