import { useEffect, useRef, useState, useCallback, useMemo, useImperativeHandle, forwardRef, ReactNode } from 'react'
import { Fraction } from 'test-r-sdk'
import { ChartPoint, ChartRangeInputOption } from './ConcentratedRangeInputChartBody'
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, ResponsiveContainer, ReferenceArea, Tooltip } from 'recharts'
import Icon from '@/components/Icon'
import { getPlatformInfo } from '@/functions/dom/getPlatformInfo'
import { PriceBoundaryReturn } from '@/application/concentrated/getNearistDataPoint'
import {
  Range,
  DEFAULT_X_AXIS,
  HIGHLIGHT_COLOR,
  unitColor,
  ZOOM_INTERVAL,
  getDefaultPointOffset,
  boundaryColor,
  strokeFillProp,
  toFixedNumber,
  getConfig,
  getLabel
} from './chartUtil'
import PriceRangeInput from './PriceRangeInput'

interface HighlightPoint extends ChartPoint {
  extend?: boolean
}

interface PositionState {
  [Range.Min]: number
  [Range.Max]: number
}

interface Props {
  poolId?: string
  decimals: number
  className?: string
  chartOptions?: ChartRangeInputOption
  currentPrice?: Fraction
  priceLabel?: string
  showCurrentPriceOnly?: boolean
  showZoom?: boolean
  hideRangeLine?: boolean
  hideRangeInput?: boolean
  hideCurrentPriceLabel?: boolean
  hideXAxis?: boolean
  height?: number
  title?: ReactNode
  onPositionChange?: (props: { min: number; max: number; side?: Range; userInput?: boolean }) => PriceBoundaryReturn
  onInDecrease?: (props: { p: number; isMin: boolean; isIncrease: boolean }) => Fraction | undefined
}

export default forwardRef(function Chart(props: Props, ref) {
  const {
    poolId,
    chartOptions,
    currentPrice,
    priceLabel,
    decimals,
    height,
    onPositionChange,
    onInDecrease,
    title,
    showCurrentPriceOnly,
    hideCurrentPriceLabel,
    hideRangeLine,
    hideRangeInput,
    showZoom,
    hideXAxis
  } = props
  const points: HighlightPoint[] = useMemo(() => Object.assign([], chartOptions?.points || []), [chartOptions?.points])
  const [defaultMin, defaultMax] = [
    chartOptions?.initMinBoundaryX as Fraction,
    chartOptions?.initMaxBoundaryX as Fraction
  ]
  const poolIdRef = useRef<string | undefined>()
  const hasPoints = points.length > 0
  const { isMobile } = getPlatformInfo() || {}
  const [displayList, setDisplayList] = useState<HighlightPoint[]>(points)
  const [isMoving, setIsMoving] = useState(false)
  const [position, setPosition] = useState<PositionState>({
    [Range.Min]: Number(defaultMin?.toFixed(decimals)) || 0,
    [Range.Max]: Number(defaultMax?.toFixed(decimals)) || 100
  })
  const [xAxis, setXAxis] = useState<number[]>([])

  const boundaryRef = useRef({ min: 0, max: 100 })
  const smoothCountRef = useRef(0)
  const moveRef = useRef('')
  const areaRef = useRef<number | undefined>()
  const xAxisRef = useRef<number[]>([])
  const tickGap = points.length ? (points[points.length - 1].x - points[0].x) / 8 / 8 : 0
  const [xAxisDomain, setXAxisDomain] = useState<string[] | number[]>(hasPoints ? DEFAULT_X_AXIS : [0, 100])
  const { offsetMin, offsetMax } = getDefaultPointOffset({
    points,
    defaultMin,
    defaultMax,
    decimals,
    showCurrentPriceOnly
  })

  boundaryRef.current = xAxisDomain.length
    ? { min: Number(xAxisDomain[0]) || 0, max: Number(xAxisDomain[xAxisDomain.length - 1]) || 100 }
    : boundaryRef.current

  const updatePosition = useCallback(
    (nextStateOrCbk: PositionState | ((prePos: PositionState) => PositionState)) => {
      const getSafeMin = (val) => Math.max(boundaryRef.current.min, val)
      if (typeof nextStateOrCbk === 'function') {
        setPosition((prePos) => {
          const newPos = nextStateOrCbk(prePos)
          return {
            [Range.Min]: toFixedNumber(getSafeMin(newPos[Range.Min]), decimals),
            [Range.Max]: toFixedNumber(newPos[Range.Max], decimals)
          }
        })
        return
      }

      setPosition({
        [Range.Min]: toFixedNumber(getSafeMin(nextStateOrCbk[Range.Min]), decimals),
        [Range.Max]: toFixedNumber(nextStateOrCbk[Range.Max], decimals)
      })
    },
    [decimals, points]
  )

  useEffect(() => {
    setDisplayList([])
    setXAxisDomain(DEFAULT_X_AXIS)
    boundaryRef.current = { min: 0, max: 100 }
    xAxisRef.current = []
    if (poolIdRef.current !== poolId) {
      setPosition({ [Range.Min]: 0, [Range.Max]: 0 })
    }
    if (!points.length) return

    const { smoothCount } = getConfig(points[0].x, points.length)
    smoothCountRef.current = smoothCount
    const displayList: HighlightPoint[] = []
    const [defaultMinNum, defaultMaxNum] = [
      defaultMin ? Number(defaultMin.toFixed(decimals)) : undefined,
      defaultMax ? Number(defaultMax.toFixed(decimals)) : undefined
    ]

    const gap = points[1].x - points[0].x
    if (defaultMinNum && defaultMinNum <= Number(points[0].x.toFixed(decimals)) + gap) {
      points.unshift({ x: Math.max(defaultMinNum - gap, 0), y: 0 })
    }
    if (defaultMaxNum && defaultMaxNum >= Number(points[points.length - 1].x.toFixed(decimals)) - gap)
      points.push({ x: defaultMaxNum + gap * 2, y: 0 })

    const pointMaxIndex = points.length - 1
    for (let i = 0; i < pointMaxIndex; i++) {
      const point = points[i]
      const nextPoint = points[i + 1]
      displayList.push({ ...point })
      // add more points to chart to smooth line
      if (!showCurrentPriceOnly && smoothCount > 0) {
        const gap = toFixedNumber((nextPoint.x - point.x) / smoothCount, decimals)
        for (let j = 1; j <= smoothCount; j++) {
          const y = toFixedNumber(j > Math.floor(smoothCount / 2) ? nextPoint.y : point.y, decimals)
          displayList.push({ x: toFixedNumber(point.x + gap * j, decimals), y })
        }
      }
    }
    if (pointMaxIndex > 0) displayList.push(points[pointMaxIndex])

    setDisplayList(displayList)
    setXAxisDomain(DEFAULT_X_AXIS)
  }, [points, defaultMin, defaultMax, decimals, showCurrentPriceOnly, poolId])

  useEffect(() => {
    if ((!defaultMin && !defaultMax) || (hasPoints && poolIdRef.current && poolIdRef.current === poolId)) return
    poolIdRef.current = hasPoints ? poolId : undefined
    updatePosition({
      [Range.Min]: Number(defaultMin.toFixed(10)) - offsetMin,
      [Range.Max]: Number(defaultMax.toFixed(10)) - offsetMax
    })
  }, [defaultMin, defaultMax, updatePosition, offsetMin, offsetMax, poolId, hasPoints])

  useEffect(() => {
    setXAxis(xAxisRef.current)
  }, [position, xAxisDomain])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.addEventListener('mouseup', handleMouseUp)
    isMobile && window.addEventListener('pointerup', handleMouseUp)
    return () => {
      window.removeEventListener('mouseup', handleMouseUp)
      isMobile && window.removeEventListener('pointerup', handleMouseUp)
    }
  }, [isMobile])

  const handleMouseUp = useCallback(() => {
    if (!moveRef.current) return
    setIsMoving(false)
    moveRef.current = ''
  }, [])
  const handleMouseDown = (side: Range) => () => {
    if (moveRef.current) return
    moveRef.current = side
    setIsMoving(true)
  }

  const formatTicks = (val: number) => {
    if (!xAxisRef.current.length || val < xAxisRef.current[xAxisRef.current.length - 1]) {
      xAxisRef.current = [val]
    } else {
      xAxisRef.current.push(val)
    }
    if (val === 0) return '0'
    if (val < 0.1) return Number(val.toFixed(4)).toString()
    if (val < 1) return Number(val.toFixed(2)).toString()
    if (val < 10) return Number(val.toFixed(1)).toString()

    return Number(val.toFixed(1)).toString()
  }

  let timer: number | undefined = undefined

  const debounceUpdate = ({ side, ...pos }: { min: number; max: number; side: Range | string }) => {
    timer && clearTimeout(timer)
    timer = window.setTimeout(() => {
      const res = onPositionChange?.(pos)
      if (!res) return
      if (side === 'area')
        updatePosition({ min: Number(res.priceLower.toFixed(9)), max: Number(res.priceUpper.toFixed(9)) })
      if (side === Range.Min)
        updatePosition((pos) => ({
          ...pos,
          [Range.Min]: Number(res.priceLower.toFixed(9))
        }))
      if (side === Range.Max)
        updatePosition((pos) => ({
          ...pos,
          [Range.Max]: Number(res.priceUpper.toFixed(9))
        }))
    }, 100)
  }
  const handleMove = useCallback(
    (e: any) => {
      if (!moveRef.current || !e) return
      // move center area
      const activeLabel = e.activeLabel
      if (!activeLabel) return
      if (moveRef.current === 'area') {
        if (areaRef.current === undefined) {
          areaRef.current = activeLabel
          return
        }
        const diff = activeLabel - areaRef.current
        areaRef.current = activeLabel
        const isDefault = typeof xAxisDomain[0] === 'string'
        const [xMin, xMax] = isDefault ? [boundaryRef.current.min, boundaryRef.current.max] : xAxisDomain
        updatePosition((pos) => {
          const [newLeft, newRight] = [pos[Range.Min] + diff, pos[Range.Max] + diff]
          const newPos = {
            [Range.Min]:
              (newLeft <= xMin && newLeft < pos[Range.Min]) || newLeft >= pos[Range.Max] ? pos[Range.Min] : newLeft,
            [Range.Max]:
              (newRight >= xMax && newRight > pos[Range.Max]) || newRight <= pos[Range.Min] ? pos[Range.Max] : newRight
          }
          debounceUpdate({ ...newPos, side: moveRef.current })
          return newPos
        })
        return
      }
      updatePosition((pos) => {
        // when min line > max line
        if (moveRef.current === Range.Min && e.activeLabel >= pos[Range.Max]) {
          moveRef.current = Range.Max
          return { ...pos, [Range.Max]: activeLabel }
        }
        // when max line < min line
        if (moveRef.current === Range.Max && e.activeLabel <= pos[Range.Min]) {
          moveRef.current = Range.Min
          return { ...pos, [Range.Min]: activeLabel }
        }
        debounceUpdate({ ...pos, [moveRef.current]: activeLabel, side: moveRef.current })
        return { ...pos, [moveRef.current]: activeLabel }
      })
    },
    [updatePosition, onPositionChange, xAxisDomain]
  )

  const getMouseEvent = (range: Range) => ({
    onPointerDown: handleMouseDown(range),
    onMouseDown: handleMouseDown(range)
  })

  const getReferenceProps = (range: Range) => {
    const isMin = range === Range.Min
    const [x1, x2] = [
      position[range] - (isMin ? 1.5 * tickGap : tickGap / 1.5),
      position[range] + (!isMin ? 1.5 * tickGap : tickGap / 1.5)
    ]
    return position[range]
      ? {
          ...getMouseEvent(range),
          x1: Math.max(x1, isMin ? xAxis[0] : position[Range.Max]),
          x2: Math.min(x2, isMin ? position[Range.Min] : xAxis[xAxis.length - 1]),
          style: { cursor: 'grab' },
          fill: 'transparent',
          isFront: true
        }
      : null
  }

  const handlePriceChange = useCallback(
    ({ val, side }: { val?: number | string; side: Range }) => {
      const newVal = parseFloat(String(val!))
      setPosition((p) => {
        setTimeout(() => {
          onPositionChange?.({ ...p, [side]: newVal, side, userInput: true })
        }, 200)
        return { ...p, [side]: newVal }
      })
      if (!points.length) return
      setDisplayList((list) => {
        const filteredList = list.filter((p) => !p.extend)
        if (side === Range.Max) {
          if (newVal > filteredList[filteredList.length - 1].x) {
            for (let i = 1; ; i++) {
              const newX = filteredList[filteredList.length - 1].x + tickGap * i
              filteredList.push({ x: newX, y: 0, extend: true })
              if (newX > newVal) break
            }
          }
        }
        return filteredList
      })
    },
    [tickGap, points, debounceUpdate]
  )

  const handleInDecrease = useCallback(
    (props: { val?: number | string; side: Range; isIncrease: boolean }): void => {
      const { val = '', side, isIncrease } = props
      const isMin = side === Range.Min
      if (isIncrease) {
        setPosition((prePos) => {
          const newPos = onInDecrease?.({ p: Number(val), isMin, isIncrease: true })
          const posNum = newPos ? parseFloat(newPos.toFixed(decimals)) : toFixedNumber(Number(val) + tickGap, decimals)
          if (hasPoints && !isMin && posNum >= toFixedNumber(prePos[Range.Max], decimals))
            setDisplayList((list) => [...list, { x: posNum + tickGap, y: 0, extend: true }])
          return { ...prePos, [side]: posNum }
        })
        return
      }
      setPosition((prePos) => {
        const newPos = onInDecrease?.({ p: Number(val), isMin, isIncrease: false })
        const posNum = newPos ? parseFloat(newPos.toFixed(decimals)) : toFixedNumber(Number(val) + tickGap, decimals)
        if (isMin && posNum <= toFixedNumber(points[0].x, decimals))
          return { ...prePos, [Range.Min]: toFixedNumber(points[0].x, decimals) } // when min < points[0].x
        if (!isMin && posNum <= prePos[Range.Min]) return prePos // when max > max points
        return { ...prePos, [side]: posNum }
      })
      return
    },
    [points, hasPoints, tickGap, decimals]
  )

  const extendDisplay = ({ min, max }: { min: number; max: number }) => {
    setDisplayList((list) => {
      const newList = list.filter((p) => !p.extend)
      const lastPoint = newList[newList.length - 1].x
      if (min < newList[0].x) {
        for (let i = 0; min <= newList[0].x; i++) newList.unshift({ x: newList[0].x - i * tickGap, y: 0, extend: true })
      }
      if (max > lastPoint) {
        for (let i = 1; newList[newList.length - 1].x <= max; i++)
          newList.push({ x: lastPoint + i * tickGap, y: 0, extend: true })
      }
      return newList
    })
  }

  const zoomReset = () => {
    setDisplayList((list) => list.filter((p) => !p.extend))
    setXAxisDomain(DEFAULT_X_AXIS)
    boundaryRef.current = {
      min: hasPoints ? displayList[0].x : 10,
      max: hasPoints ? displayList[displayList.length - 1].x : 100
    }
  }
  const zoomIn = () => {
    if (!hasPoints) return
    const [min, max] = [
      xAxisRef.current[0] + tickGap * ZOOM_INTERVAL,
      xAxisRef.current[xAxisRef.current.length - 1] - tickGap * ZOOM_INTERVAL
    ]
    if (min >= max) return
    boundaryRef.current = { min, max }
    setXAxisDomain([min, max])
  }
  const zoomOut = () => {
    if (!hasPoints) return
    const [min, max] = [
      Math.max(xAxisRef.current[0] - tickGap * ZOOM_INTERVAL, 0),
      xAxisRef.current[xAxisRef.current.length - 1] + tickGap * ZOOM_INTERVAL
    ]
    boundaryRef.current.min = min
    boundaryRef.current.max = max
    extendDisplay({ min, max })
    setXAxisDomain([min, max])
  }

  useImperativeHandle(
    ref,
    () => ({
      getPosition: () => position
    }),
    [position]
  )

  return (
    <>
      <div className="flex justify-between text-base leading-[22px] text-secondary-title mb-2">
        {title}
        {showZoom && (
          <div className="flex gap-2 select-none">
            <Icon
              onClick={zoomReset}
              className="saturate-50 brightness-125 cursor-pointer"
              iconSrc="/icons/chart-add-white-space.svg"
            />
            <Icon
              className="text-[#abc4ff] saturate-50 brightness-125 cursor-pointer"
              onClick={zoomIn}
              heroIconName="zoom-in"
              canLongClick
            />
            <Icon
              onClick={zoomOut}
              className="text-[#abc4ff] saturate-50 brightness-125 cursor-pointer"
              heroIconName="zoom-out"
              canLongClick
            />
          </div>
        )}
      </div>
      <div className="text-[#ABC4FF] text-sm text-center">
        {hideCurrentPriceLabel ? undefined : `Current Price: ${currentPrice?.toSignificant(4)} ${priceLabel || ''}`}
      </div>
      <div className="w-full select-none" style={{ height: `${height || 140}px` }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            style={{ userSelect: 'none' }}
            width={500}
            height={400}
            margin={{ top: 10 }}
            defaultShowTooltip={false}
            data={displayList || []}
            onMouseDown={isMobile ? handleMouseDown(Range.Min) : undefined}
            onMouseMove={handleMove}
            onMouseUp={handleMouseUp}
          >
            <Area
              {...strokeFillProp}
              fillOpacity={0.9}
              animateNewValues={false}
              style={{ cursor: isMoving ? 'grab' : 'default' }}
              legendType="none"
              tooltipType="none"
              isAnimationActive={false}
              activeDot={false}
              dot={false}
              type="step"
              dataKey="y"
            />
            {!hideRangeLine && (
              <Tooltip wrapperStyle={{ display: 'none' }} isAnimationActive={false} cursor={false} active={false} />
            )}
            <XAxis
              style={{ userSelect: 'none', fontSize: '10px', fill: unitColor }}
              type="number"
              tickCount={7}
              tickFormatter={formatTicks}
              domain={xAxisDomain}
              interval="preserveStartEnd"
              allowDataOverflow={true}
              hide={hideXAxis}
              tickLine={false}
              dataKey="x"
            />
            <YAxis allowDataOverflow domain={['dataMin', 'dataMax']} type="number" hide={true} />
            {!hideRangeLine && position[Range.Min] && (
              <ReferenceLine
                {...getMouseEvent(Range.Min)}
                stroke={boundaryColor}
                className="cursor-grab"
                isFront={true}
                x={position[Range.Min]}
                strokeWidth={4}
                label={getLabel({ side: Range.Min, ...getMouseEvent(Range.Min) })}
              />
            )}
            {!hideRangeLine && position[Range.Max] && (
              <ReferenceLine
                {...getMouseEvent(Range.Max)}
                stroke={boundaryColor}
                className="cursor-grab"
                isFront={true}
                x={position[Range.Max]}
                strokeWidth={4}
                label={getLabel({ side: Range.Max, ...getMouseEvent(Range.Max) })}
              />
            )}
            {currentPrice && (
              <ReferenceLine
                isFront={true}
                x={currentPrice?.toSignificant(4)}
                stroke="#FFF"
                strokeDasharray="4"
                strokeWidth={2}
              />
            )}
            {hasPoints && (
              <ReferenceArea
                style={{ cursor: hideRangeLine ? 'default' : 'pointer' }}
                onPointerDown={
                  isMobile && !hideRangeLine
                    ? () => {
                        setIsMoving(true)
                        areaRef.current = undefined
                        moveRef.current = 'area'
                      }
                    : undefined
                }
                onMouseDown={
                  !hideRangeLine
                    ? () => {
                        setIsMoving(true)
                        areaRef.current = undefined
                        moveRef.current = 'area'
                      }
                    : undefined
                }
                x1={Math.max(position[Range.Min], displayList[0]?.x || 0, xAxis[0])}
                x2={Math.min(
                  position[Range.Max],
                  displayList[displayList.length - 1]?.x,
                  xAxis[xAxis.length - 1] || Number.MAX_SAFE_INTEGER
                )}
                fill={HIGHLIGHT_COLOR}
                fillOpacity="0.3"
              />
            )}
            {!hideRangeLine && <ReferenceArea {...getReferenceProps(Range.Min)} />}
            {!hideRangeLine && <ReferenceArea {...getReferenceProps(Range.Max)} />}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {!hideRangeInput && (
        <PriceRangeInput
          decimals={decimals}
          minValue={position.min}
          maxValue={position.max}
          onPriceChange={handlePriceChange}
          onInDecrease={handleInDecrease}
        />
      )}
    </>
  )
})
