"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef, useState, type ReactNode } from "react"

/**
 * Animated page wrapper — crossfade + subtle slide up on route change.
 * Wraps children in a div that animates on pathname changes.
 * Uses CSS classes for GPU-accelerated transforms.
 */
export function PageTransition({ children }: { children: ReactNode }) {
    const pathname = usePathname()
    const [displayChildren, setDisplayChildren] = useState(children)
    const [phase, setPhase] = useState<"enter" | "idle">("enter")
    const prevPath = useRef(pathname)

    useEffect(() => {
        if (pathname !== prevPath.current) {
            prevPath.current = pathname
            // Immediately swap to new content + re-trigger enter
            setDisplayChildren(children)
            setPhase("enter")
        } else {
            setDisplayChildren(children)
        }
    }, [pathname, children])

    // After enter animation completes, switch to idle
    useEffect(() => {
        if (phase === "enter") {
            const timer = setTimeout(() => setPhase("idle"), 280)
            return () => clearTimeout(timer)
        }
    }, [phase])

    return (
        <div
            className={phase === "enter" ? "page-enter" : "page-idle"}
            style={{ willChange: phase === "enter" ? "opacity, transform" : "auto" }}
        >
            {displayChildren}
        </div>
    )
}

/**
 * Stagger container — children fade-up with incremental delays.
 * Usage: <StaggerContainer> wraps a list of items that animate in sequence.
 */
export function StaggerContainer({
    children,
    className = "",
    staggerMs = 60,
}: {
    children: ReactNode
    className?: string
    staggerMs?: number
}) {
    const ref = useRef<HTMLDivElement>(null)
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        // Use requestAnimationFrame for smooth first paint
        const raf = requestAnimationFrame(() => setVisible(true))
        return () => cancelAnimationFrame(raf)
    }, [])

    useEffect(() => {
        if (visible && ref.current) {
            const items = ref.current.querySelectorAll(":scope > *")
            items.forEach((item, i) => {
                const el = item as HTMLElement
                el.style.opacity = "0"
                el.style.transform = "translateY(12px)"
                el.style.transition = `opacity 350ms cubic-bezier(0.16, 1, 0.3, 1), transform 350ms cubic-bezier(0.16, 1, 0.3, 1)`
                el.style.transitionDelay = `${i * staggerMs}ms`

                // Force reflow then animate
                requestAnimationFrame(() => {
                    el.style.opacity = "1"
                    el.style.transform = "translateY(0)"
                })
            })
        }
    }, [visible, staggerMs])

    return (
        <div ref={ref} className={className}>
            {children}
        </div>
    )
}
