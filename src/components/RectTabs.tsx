import { shrinkToValue } from '@/functions/shrinkToValue'
import { MayFunction } from '@/types/constants'
import { ReactNode, useCallback, MouseEvent } from 'react'
import { twMerge } from 'tailwind-merge'

export interface TabItem {
  label: ReactNode
  className?: string
  value: string | number
}

interface Props {
  classNames?: string
  tabs: TabItem[]
  tabClassName?: MayFunction<string, [selected: boolean]>
  selectedValue?: string | number
  onChange?: (tab: TabItem) => void
}

//active-tab-bg

export default function RectTabs(props: Props) {
  const { classNames, tabs, selectedValue, onChange, tabClassName } = props

  const handleChange = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      onChange?.(tabs.find((tab) => tab.value === e.currentTarget.dataset['val'])!)
    },
    [onChange, tabs]
  )

  return (
    <div className={twMerge('flex rounded-lg p-1 bg-dark-blue', classNames)}>
      {tabs.map((tab) => {
        const isSelected = selectedValue === tab.value
        return (
          <div
            key={tab.value}
            onClick={isSelected ? undefined : handleChange}
            data-val={tab.value}
            className={twMerge(
              `flex text-xs ${
                isSelected ? 'bg-active-tab-bg text-[#39d0d8] cursor-default' : 'text-[#39d0d880] cursor-pointer'
              }`,
              shrinkToValue(tabClassName, [isSelected]),
              tab.className
            )}
          >
            <div className="py-1 px-2.5">{tab.label}</div>
          </div>
        )
      })}
    </div>
  )
}
