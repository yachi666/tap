import { type ElementType } from 'react';

export function MetricCard({
  icon: Icon,
  label,
  value,
  delta,
  tone,
}: {
  icon: ElementType;
  label: string;
  value: string;
  delta: string;
  tone: string;
}) {
  return (
    <button className={`metric-card tone-${tone}`} type="button">
      <span>
        <Icon size={23} weight="duotone" />
      </span>
      <small>{label}</small>
      <strong>{value}</strong>
      <em>{delta}</em>
    </button>
  );
}
