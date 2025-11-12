"use client"

import { useEffect } from "react"
import { animate, motion, useMotionValue, useTransform } from "motion/react"

export default function HTMLContent({
  onDone,
  overlay = true,          // shows a full-screen blocker like Splash
  firstTo = 67,
  firstDuration = 2,
  pauseMs = 600,
  finalTo = 100,
  finalDuration = 1,
  size = 64,
//   white colour
  color = "#ffffff",
}) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, v => Math.round(v))

  useEffect(() => {
    let controls
    let cancelled = false

    ;(async () => {
      // 0 -> firstTo
      controls = animate(count, firstTo, { duration: firstDuration })
      await controls.finished
      if (cancelled) return

      // pause
      await sleep(pauseMs)
      if (cancelled) return

      // firstTo -> finalTo
      controls = animate(count, finalTo, { duration: finalDuration })
      await controls.finished
      if (cancelled) return

      // notify parent that we're done
      onDone?.()
    })()

    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [count, firstTo, firstDuration, pauseMs, finalTo, finalDuration, onDone])

  const content = (
    <motion.pre style={{ fontSize: size, lineHeight: 1, color }}>
      {rounded}
    </motion.pre>
  )

  if (!overlay) return content

  // Full-screen overlay mode
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      {content}
    </div>
  )
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms))
}
