import { AnyFn } from '@/types/constants'
import { addItem } from './arrayMethods'
import { groupItems } from './groupItems'

const invokedRecord = new Map<string, (LazyMapSettings<any, any> & { idleId: number })[]>()

type LazyMapSettings<T, U> = {
  sourceKey: string
  source: T[]
  loopFn: (item: T, index: number, source: readonly T[]) => U
}

/**
 * like Array's map(), but each loop will check if new task is pushed in todo queue
 * inspired by `window.requestIdleCallback()`
 * @param settings.source arr
 * @param settings.sourceKey flag for todo queue
 * @param settings.loopFn like js: array::map
 */
export function lazyMap<T, U>(setting: LazyMapSettings<T, U>): Promise<U[]> {
  return new Promise((resolve) => {
    const idleId = requestIdleCallback(async () => {
      // console.time(`lazy map (${setting.sourceKey})`)

      // const result = setting.source.map(setting.loopFn)
      const result = await lazyMapCoreMap(setting.source, setting.loopFn)
      resolve(result)
      // console.timeEnd(`lazy map (${setting.sourceKey})`)
    })

    // cancel the last idle callback, and record new setting
    const currentKeySettings = invokedRecord.get(setting.sourceKey) ?? []
    const lastIdleId = currentKeySettings[currentKeySettings.length - 1]?.idleId
    if (lastIdleId) cancelIdleCallback(lastIdleId)
    invokedRecord.set(setting.sourceKey, addItem(invokedRecord.get(setting.sourceKey) ?? [], { ...setting, idleId }))
  })
}

export function requestIdleCallback(fn: AnyFn): number {
  return window.requestIdleCallback ? window.requestIdleCallback?.(fn) : window.setTimeout?.(fn) // Safari no't support `window.requestIdleCallback()`, so have to check first
}

export function cancelIdleCallback(handleId: number): void {
  return window.cancelIdleCallback ? window.cancelIdleCallback?.(handleId) : window.clearTimeout(handleId)
}

async function lazyMapCoreMap<T, U>(
  arr: T[],
  mapFn: (item: T, index: number, source: readonly T[]) => U
): Promise<U[]> {
  const wholeResult: U[] = []
  for (const blockList of groupItems(arr)) {
    await new Promise((resolve) => {
      requestIdleCallback(() => {
        const newResultList = blockList.map(mapFn)
        wholeResult.push(...newResultList)
        resolve(undefined)
      })
    }) // forcely use microtask
  }
  return wholeResult
}
