import { useEffect, useState } from 'react'

const MOBILE_QUERY = '(max-width: 900px)'

/** 响应式断点（与 global.css 的 900px 抽屉断点一致）。 */
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  )

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setIsMobile(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return { isMobile }
}
