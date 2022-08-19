import useConcentrated from '@/application/concentrated/useConcentrated'
import Col from '@/components/Col'
import Icon from '@/components/Icon'
import InputBox from '@/components/InputBox'
import Row from '@/components/Row'
import RowTabs from '@/components/RowTabs'
import { twMerge } from 'tailwind-merge'
import { ConcentratedChartBody } from './ChartBody'

const mokeChartData = Array.from({ length: 20 }, (_, i) => ({ x: i * 10, y: i * 10 * Math.random() }))
export function ConcentratedChart({ className }: { className?: string }) {
  const coin1 = useConcentrated((s) => s.coin1)
  const coin2 = useConcentrated((s) => s.coin2)

  return (
    <Col className={twMerge('py-4', className)}>
      <Row className="justify-between items-center">
        <div className="text-lg text-white">Price Range</div>
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
          <Row>
            <Icon heroIconName="zoom-in" />
            <Icon heroIconName="zoom-out" />
          </Row>
        </Row>
      </Row>
      <ConcentratedChartBody points={mokeChartData} className="my-2" />
      <Row className="gap-4">
        <InputBox className="grow" label="Min Price" decimalMode />
        <InputBox className="grow" label="Max Price" decimalMode />
      </Row>
    </Col>
  )
}
