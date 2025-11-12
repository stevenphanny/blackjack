"use client"

import { useEffect } from "react"
import { animate, motion, useMotionValue, useTransform } from "motion/react"

export default function Splash({ onDone, duration = 2 }) {
  const count = useMotionValue(0)
  const rounded = useTransform(() => Math.round(count.get()))

  useEffect(() => {
    const controls = animate(count, 100, { duration })
    controls.finished.then(() => onDone?.())
    return () => controls.stop()
  }, [duration, onDone])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <motion.pre style={{ fontSize: 72, lineHeight: 1, color: "#61afef" }}>
        {rounded}
      </motion.pre>
    </div>
  )
}