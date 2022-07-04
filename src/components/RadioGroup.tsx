import { CSSProperties, ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

import { shrinkToValue } from '@/functions/shrinkToValue'
import { RadioGroup as _RadioGroup } from '@headlessui/react'
import { MayFunction } from '@/types/constants'

export interface RadioGroupProps<T extends string> {
  className?: string
  style?: CSSProperties
  // TODO: itemClassName\itemStyle\value\label should be merged into a obj
  itemClassName?: string | ((checked: boolean) => string)
  itemStyle?: CSSProperties | ((checked: boolean, itemIndex: number, values: readonly T[]) => CSSProperties)
  currentValue?: T
  values: readonly T[]
  labels?: readonly MayFunction<ReactNode, [checked: boolean, itemIndex: number, values: readonly T[]]>[]
  /** this callback may be invoke in init if user input URL has a hash   */
  onChange?: (currentValue: T) => any
}

/** everything changed by `<TabSwitcher>` may affect  hash  */
export default function RadioGroup<T extends string>({
  className,
  style,
  itemClassName,
  itemStyle,
  values,
  currentValue = values[0],
  labels = values, // it will not update when values changed
  onChange
}: RadioGroupProps<T>): JSX.Element {
  if (!values.filter(Boolean).length) return <></>

  return (
    <_RadioGroup
      value={currentValue}
      onChange={onChange ?? (() => {})}
      className={twMerge(`flex ${className ?? ''}`)}
      style={style}
    >
      {values.map((value, idx, vals) => (
        <_RadioGroup.Option value={value} key={idx} className="cursor-pointer flex grow">
          {({ checked }) =>
            value && (
              <div
                className={`grid grow place-items-center ${shrinkToValue(itemClassName, [checked])}`}
                style={shrinkToValue(itemStyle, [checked, idx, vals])}
              >
                {shrinkToValue(labels[idx], [checked, idx, vals])}
              </div>
            )
          }
        </_RadioGroup.Option>
      ))}
    </_RadioGroup>
  )
}
