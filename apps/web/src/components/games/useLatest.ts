import { useRef } from 'react'

/** Always-current reference to a value — lets game loops call the latest callbacks without restarting. */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  ref.current = value
  return ref
}
