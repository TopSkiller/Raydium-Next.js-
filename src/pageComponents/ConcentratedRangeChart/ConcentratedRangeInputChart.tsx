import useConcentrated from '@/application/concentrated/useConcentrated'
import Col from '@/components/Col'
import Icon from '@/components/Icon'
import InputBox from '@/components/InputBox'
import Row from '@/components/Row'
import RowTabs from '@/components/RowTabs'
import { useRef, useState } from 'react'
import { twMerge } from 'tailwind-merge'
import {
  ConcentratedRangeInputChartBodyComponentHandler,
  ChartRangeInputOption,
  ConcentratedRangeInputChartBody
} from './ConcentratedRangeInputChartBody'

// Temp const mokeChartData = Array.from({ length: 50000 }, (_, i) => ({ x: i * 0.01, y: 0.01 * Math.random() }))
export function ConcentratedRangeInputChart({
  className,
  chartOptions
}: {
  className?: string
  chartOptions?: ChartRangeInputOption
}) {
  const coin1 = useConcentrated((s) => s.coin1)
  const coin2 = useConcentrated((s) => s.coin2)
  const [minPrice, setMinPrice] = useState(0.9)
  const [maxPrice, setMaxPrice] = useState(1.0020019011404842)
  const concentratedChartBodyRef = useRef<ConcentratedRangeInputChartBodyComponentHandler>(null)
  return (
    <Col className={twMerge('py-4', className)}>
      <Row className="justify-between items-center">
        <div className=" font-bold text-white">Price Range</div>
        <Row className="items-center gap-2">
          {coin1 && coin2 && (
            <RowTabs
              size="sm"
              currentValue={coin1.symbol}
              values={[coin1.symbol ?? '--', coin2?.symbol ?? '--']}
              onChange={() => {
                // ONGOING
              }}
            />
          )}
          <Row className="gap-2">
            <Icon
              className="saturate-50 brightness-125"
              iconSrc="/icons/chart-add-white-space.svg"
              onClick={() => {
                concentratedChartBodyRef.current?.shrinkToView()
              }}
            />
            <Icon
              className="text-[#abc4ff] saturate-50 brightness-125"
              heroIconName="zoom-in"
              onClick={() => {
                concentratedChartBodyRef.current?.zoomIn({ align: 'center' })
              }}
              canLongClick
            />
            <Icon
              className="text-[#abc4ff] saturate-50 brightness-125"
              heroIconName="zoom-out"
              onClick={() => {
                concentratedChartBodyRef.current?.zoomOut({ align: 'center' })
              }}
              canLongClick
            />
          </Row>
        </Row>
      </Row>
      <ConcentratedRangeInputChartBody
        initMinBoundaryX={minPrice}
        initMaxBoundaryX={maxPrice}
        componentRef={concentratedChartBodyRef}
        className="my-2"
        onChangeMinBoundary={(nearestPoint) => {
          setMinPrice(nearestPoint.x)
        }}
        onChangeMaxBoundary={(nearestPoint) => {
          setMaxPrice(nearestPoint.x)
        }}
        {...chartOptions}
      />
      <Row className="gap-4">
        <InputBox
          className="grow"
          label="Min Price"
          decimalMode
          showArrowControls
          decimalCount={concentratedChartBodyRef.current?.accurateDecimalLength}
          value={minPrice}
          onUserInput={(v) => {
            concentratedChartBodyRef.current?.inputMinBoundaryX(Number(v))
          }}
        />
        <InputBox
          className="grow"
          label="Max Price"
          decimalMode
          showArrowControls
          decimalCount={concentratedChartBodyRef.current?.accurateDecimalLength}
          value={maxPrice}
          onUserInput={(v) => {
            concentratedChartBodyRef.current?.inputMaxBoundaryX(Number(v))
          }}
        />
      </Row>
    </Col>
  )
}
