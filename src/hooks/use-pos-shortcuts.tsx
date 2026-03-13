"use client"

import { useEffect, useCallback } from "react"

/**
 * POS Keyboard Shortcuts Hook
 * F1-F12: Select category (by sort order)
 * Ctrl+F: Focus search
 * Ctrl+B: Select table
 * Ctrl+P: Pay order
 * Ctrl+H: Hold order
 * Ctrl+K: Send to kitchen
 * Ctrl+D: Apply discount
 * Escape: Clear search / close modals
 * Delete / Backspace: Clear cart (when search empty)
 */
export type POSShortcutActions = {
    onCategorySelect: (index: number) => void
    onFocusSearch: () => void
    onSelectTable: () => void
    onPayOrder: () => void
    onHoldOrder: () => void
    onSendToKitchen: () => void
    onApplyDiscount: () => void
    onEscape: () => void
    onClearCart: () => void
    enabled?: boolean
}

const F_KEYS = ["F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12"] as const

export function usePOSShortcuts(actions: POSShortcutActions) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (actions.enabled === false) return

            // Ignore when typing in input/textarea/select
            const target = e.target as HTMLElement
            const isInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT"
            const isContentEditable = target.isContentEditable

            // F1-F12: Category switching (always active, even in inputs)
            const fIndex = F_KEYS.indexOf(e.key as typeof F_KEYS[number])
            if (fIndex !== -1) {
                e.preventDefault()
                e.stopPropagation()
                actions.onCategorySelect(fIndex)
                return
            }

            // Escape: always active
            if (e.key === "Escape") {
                e.preventDefault()
                actions.onEscape()
                return
            }

            // Ctrl shortcuts: not in inputs
            if (e.ctrlKey && !isInput && !isContentEditable) {
                switch (e.key.toLowerCase()) {
                    case "f":
                        e.preventDefault()
                        actions.onFocusSearch()
                        break
                    case "b":
                        e.preventDefault()
                        actions.onSelectTable()
                        break
                    case "p":
                        e.preventDefault()
                        actions.onPayOrder()
                        break
                    case "h":
                        e.preventDefault()
                        actions.onHoldOrder()
                        break
                    case "k":
                        e.preventDefault()
                        actions.onSendToKitchen()
                        break
                    case "d":
                        e.preventDefault()
                        actions.onApplyDiscount()
                        break
                    default:
                        break
                }
                return
            }

            // Delete/Backspace when not in input: clear cart
            if (!isInput && !isContentEditable && (e.key === "Delete" || e.key === "Backspace")) {
                e.preventDefault()
                actions.onClearCart()
            }
        },
        [actions]
    )

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown, { capture: true })
        return () => window.removeEventListener("keydown", handleKeyDown, { capture: true })
    }, [handleKeyDown])
}

/**
 * Shortcut badge overlay for category buttons
 */
export function ShortcutBadge({ index }: { index: number }) {
    if (index >= 12) return null
    return (
        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-800 text-[7px] font-bold text-cream-50 ring-1 ring-cream-50 opacity-60">
            F{index + 1}
        </span>
    )
}
