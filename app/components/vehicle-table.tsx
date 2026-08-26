"use client";

import { useMemo } from "react";
import { controlledReasons } from "@/lib/demo-tasks";
import type { VehicleListing } from "@/lib/study-types";

export function VehicleTable({ listings }: { listings: VehicleListing[] }) {
  const fields = useMemo(() => {
    const ordered: string[] = [];
    for (const listing of listings) {
      for (const field of Object.keys(listing.values)) {
        if (!ordered.includes(field)) ordered.push(field);
      }
    }
    return ordered;
  }, [listings]);

  return (
    <div className="vehicle-table" style={{ "--listing-count": listings.length } as React.CSSProperties}>
      <div className="vehicle-table-row vehicle-table-head">
        <span className="property-label">Property</span>
        {listings.map((listing) => <strong key={listing.id}>{listing.label}</strong>)}
      </div>
      {fields.map((field) => (
        <div className="vehicle-table-row" key={field}>
          <span className="property-label">{field}</span>
          {listings.map((listing) => {
            const value = listing.values[field];
            const missing = value === null || value === undefined || value === "";
            return (
              <span className={missing ? "missing-value" : ""} key={listing.id}>
                {missing ? "Not provided" : String(value)}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function ReasonSelector({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <fieldset className="reason-fieldset">
      <legend>What most influenced this response? <span>(optional)</span></legend>
      <div className="chip-grid">
        {controlledReasons.map(([value, label]) => (
          <label className={selected.includes(value) ? "reason-chip selected" : "reason-chip"} key={value}>
            <input
              checked={selected.includes(value)}
              onChange={() => onChange(
                selected.includes(value)
                  ? selected.filter((item) => item !== value)
                  : [...selected, value],
              )}
              type="checkbox"
            />
            {label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
