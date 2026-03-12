// Shift type definitions — shared between client & server
export const SHIFT_TYPES: Record<string, { label: string; start: string; end: string }> = {
    MORNING: { label: "Sáng", start: "08:00", end: "14:00" },
    AFTERNOON: { label: "Chiều", start: "14:00", end: "22:00" },
    EVENING: { label: "Tối", start: "17:00", end: "23:00" },
    FULL: { label: "Cả ngày", start: "10:00", end: "22:00" },
}
