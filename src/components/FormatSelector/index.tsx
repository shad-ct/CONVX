import type { Format } from '../../engine/types';
import { getSupportedOutputs } from '../../engine/registry';

interface FormatSelectorProps {
  from: Format;
  value: Format;
  onChange: (to: Format) => void;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({ from, value, onChange }) => {
  const outputs = getSupportedOutputs(from);

  return (
    <div className="inline-flex items-center">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Format)}
        className="border-2 border-black font-mono text-xs font-black bg-white px-2 py-1 uppercase shadow-[2px_2px_0_#000] focus:outline-none cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0_#000]"
        aria-label="Select target format"
      >
        {outputs.map((fmt) => (
          <option key={fmt} value={fmt}>
            {fmt.toUpperCase()}
          </option>
        ))}
      </select>
    </div>
  );
};
