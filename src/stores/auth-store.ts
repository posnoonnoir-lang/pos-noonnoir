import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type SessionStaff = {
    id: string
    fullName: string
    role: string
    avatarUrl?: string | null
}

type AuthState = {
    staff: SessionStaff | null
    isAuthenticated: boolean
    _hasHydrated: boolean
    login: (staff: SessionStaff) => void
    logout: () => void
    setHasHydrated: (state: boolean) => void
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            staff: null,
            isAuthenticated: false,
            _hasHydrated: false,
            login: (staff) => set({ staff, isAuthenticated: true }),
            logout: () => set({ staff: null, isAuthenticated: false }),
            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'noonnoir-auth',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true)
            },
        }
    )
)

