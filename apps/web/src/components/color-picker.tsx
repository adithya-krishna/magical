'use client';

import { cn } from '@/lib/utils';

const COLOR_LIST = [
  {
    name: 'red',
    value: 'bg-red-500',
  },
  {
    name: 'orange',
    value: 'bg-orange-500',
  },
  {
    name: 'amber',
    value: 'bg-amber-500',
  },
  {
    name: 'yellow',
    value: 'bg-yellow-500',
  },
  {
    name: 'lime',
    value: 'bg-lime-500',
  },
  {
    name: 'green',
    value: 'bg-green-500',
  },
  {
    name: 'emerald',
    value: 'bg-emerald-500',
  },
  {
    name: 'teal',
    value: 'bg-teal-500',
  },
  {
    name: 'cyan',
    value: 'bg-cyan-500',
  },
  {
    name: 'sky',
    value: 'bg-sky-400',
  },
  {
    name: 'blue',
    value: 'bg-blue-500',
  },
  {
    name: 'indigo',
    value: 'bg-indigo-500',
  },
  {
    name: 'violet',
    value: 'bg-violet-500',
  },
  {
    name: 'slate',
    value: 'bg-slate-500',
  },
  {
    name: 'gray',
    value: 'bg-gray-400',
  },
];

interface ColorPickerProps {
  onChange: (event: string) => void;
  value: string;
}

export function ColorPicker({
  onChange,
  value,
  className,
}: Omit<React.ComponentProps<'div'>, 'onChange' | 'value'> & ColorPickerProps) {
  const selectedColorIndex = COLOR_LIST.findIndex(c => c.value === value);
  const activeIndex = selectedColorIndex >= 0 ? selectedColorIndex : 0;

  return (
    <div className={cn('mt-1 flex flex-wrap gap-2', className)}>
      {COLOR_LIST.map((c, i) => (
        <button
          key={c.name + i}
          onClick={() => {
            onChange(COLOR_LIST[i].value);
          }}
          type="button"
          aria-label={`Select ${c.name} color`}
          className={cn(
            'size-5 rounded-full',
            c.value,
            activeIndex === i && 'ring-black ring-2 ring-offset-2',
          )}
        />
      ))}
    </div>
  );
}
