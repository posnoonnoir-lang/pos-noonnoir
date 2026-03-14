import { create } from "zustand"
import { persist } from "zustand/middleware"

interface SidebarState {
    collapsed: boolean
    mobileOpen: boolean
    setCollapsed: (collapsed: boolean) => void
    toggle: () => void
    setMobileOpen: (open: boolean) => void
    toggleMobile: () => void
}

export const useSidebarStore = create<SidebarState>()(
    persist(
        (set) => ({
            collapsed: false,
            mobileOpen: false,
            setCollapsed: (collapsed) => set({ collapsed }),
            toggle: () => set((s) => ({ collapsed: !s.collapsed })),
            setMobileOpen: (mobileOpen) => set({ mobileOpen }),
            toggleMobile: () => set((s) => ({ mobileOpen: !s.mobileOpen })),
        }),
        {
            name: "noonnoir-sidebar",
            partialize: (state) => ({ collapsed: state.collapsed }),
        }
    )
)
