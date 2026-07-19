interface Props {
  instructions: string;
  metricLabel: string;
  targetMetric: number;
  value: number | "";
  onChange: (value: number | "") => void;
}

export default function DrillReport({ instructions, metricLabel, targetMetric, value, onChange }: Props) {
  return (
    <div className="drill-report">
      <p>{instructions}</p>
      <label className="drill-input-label">
        Your result ({metricLabel}, target: {targetMetric}+)
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        />
      </label>
    </div>
  );
}
