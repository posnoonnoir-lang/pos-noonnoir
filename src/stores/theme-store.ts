"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ThemeId = "forest" | "burgundy" | "midnight" | "espresso" | "noir"

export interface ThemePalette {
    id: ThemeId
    name: string
    nameVi: string
    description: string
    preview: { primary: string; sidebar: string; accent: string; bg: string }
    vars: Record<string, string>
}

export const THEMES: ThemePalette[] = [
    {
        id: "forest",
        name: "Forest",
        nameVi: "Rừng Xanh",
        description: "Xanh rừng + Kem ấm — Thiên nhiên & sang trọng",
        preview: { primary: "#1B3A2D", sidebar: "#1B3A2D", accent: "#722F37", bg: "#FAF6F0" },
        vars: {
            // Primary — Forest Green
            "--color-green-50": "#EDF5F0",
            "--color-green-100": "#E8F0EB",
            "--color-green-200": "#C2D9CA",
            "--color-green-300": "#8BB89D",
            "--color-green-400": "#5A9A73",
            "--color-green-500": "#3A7A5C",
            "--color-green-600": "#2D5E48",
            "--color-green-700": "#234A39",
            "--color-green-800": "#1E3D30",
            "--color-green-900": "#1B3A2D",
            // Background — Cream
            "--color-cream-50": "#FAF6F0",
            "--color-cream-100": "#F5EDE0",
            "--color-cream-200": "#EDE3D2",
            "--color-cream-300": "#DDD0BB",
            "--color-cream-400": "#C4B59E",
            "--color-cream-500": "#A89880",
            // Accent — Wine
            "--color-wine-50": "#FCF5F6",
            "--color-wine-100": "#F5E6E8",
            "--color-wine-200": "#E8C5CA",
            "--color-wine-300": "#D4949C",
            "--color-wine-400": "#B8636E",
            "--color-wine-500": "#A4454E",
            "--color-wine-600": "#8B3A42",
            "--color-wine-700": "#722F37",
            "--color-wine-800": "#5C2028",
            "--color-wine-900": "#4A1219",
        },
    },
    {
        id: "burgundy",
        name: "Burgundy",
        nameVi: "Rượu Vang",
        description: "Đỏ burgundy + Kem ngà — Wine bar cổ điển",
        preview: { primary: "#4A1525", sidebar: "#3D1220", accent: "#8B6914", bg: "#FBF7F2" },
        vars: {
            // Primary — Burgundy/Maroon
            "--color-green-50": "#FDF5F7",
            "--color-green-100": "#F8E8EC",
            "--color-green-200": "#EECBD3",
            "--color-green-300": "#D99AAA",
            "--color-green-400": "#B86478",
            "--color-green-500": "#8E3B52",
            "--color-green-600": "#6E2D40",
            "--color-green-700": "#5A2334",
            "--color-green-800": "#4A1A2B",
            "--color-green-900": "#3D1220",
            // Background — Warm ivory
            "--color-cream-50": "#FBF7F2",
            "--color-cream-100": "#F5EDE1",
            "--color-cream-200": "#EDE0CF",
            "--color-cream-300": "#DFD0B8",
            "--color-cream-400": "#C8B89D",
            "--color-cream-500": "#AD9C80",
            // Accent — Antique Gold
            "--color-wine-50": "#FDF9F0",
            "--color-wine-100": "#F6EDCF",
            "--color-wine-200": "#E8D5A0",
            "--color-wine-300": "#D4B76A",
            "--color-wine-400": "#B89B3E",
            "--color-wine-500": "#9A8024",
            "--color-wine-600": "#8B6914",
            "--color-wine-700": "#725510",
            "--color-wine-800": "#5C440E",
            "--color-wine-900": "#4A360A",
        },
    },
    {
        id: "midnight",
        name: "Midnight",
        nameVi: "Đêm Khuya",
        description: "Xanh đen + Bạc trắng — Lounge bar hiện đại",
        preview: { primary: "#14202E", sidebar: "#14202E", accent: "#C4986C", bg: "#F4F6F8" },
        vars: {
            // Primary — Dark Navy
            "--color-green-50": "#EBF0F5",
            "--color-green-100": "#DCE5EE",
            "--color-green-200": "#B0C4D8",
            "--color-green-300": "#7A9AB8",
            "--color-green-400": "#4C7294",
            "--color-green-500": "#355878",
            "--color-green-600": "#28445E",
            "--color-green-700": "#1E354C",
            "--color-green-800": "#182A3D",
            "--color-green-900": "#14202E",
            // Background — Cool gray white
            "--color-cream-50": "#F4F6F8",
            "--color-cream-100": "#E8ECF0",
            "--color-cream-200": "#D8DEE5",
            "--color-cream-300": "#C0C9D4",
            "--color-cream-400": "#9DA8B5",
            "--color-cream-500": "#7C8895",
            // Accent — Copper/Rose Gold
            "--color-wine-50": "#FDF8F3",
            "--color-wine-100": "#F6E8DC",
            "--color-wine-200": "#E8CCAF",
            "--color-wine-300": "#D4AA80",
            "--color-wine-400": "#C4986C",
            "--color-wine-500": "#A87C4F",
            "--color-wine-600": "#8C6540",
            "--color-wine-700": "#724F33",
            "--color-wine-800": "#5C3F2A",
            "--color-wine-900": "#4A3220",
        },
    },
    {
        id: "espresso",
        name: "Espresso",
        nameVi: "Cà Phê",
        description: "Nâu espresso + Kem sữa — Không gian ấm cúng",
        preview: { primary: "#2E1E14", sidebar: "#2E1E14", accent: "#6B7B3A", bg: "#FAF5EF" },
        vars: {
            // Primary — Espresso Brown
            "--color-green-50": "#F5F0E8",
            "--color-green-100": "#ECE4D6",
            "--color-green-200": "#D4C4AA",
            "--color-green-300": "#B09878",
            "--color-green-400": "#8C7050",
            "--color-green-500": "#6E5438",
            "--color-green-600": "#55402C",
            "--color-green-700": "#433222",
            "--color-green-800": "#38281B",
            "--color-green-900": "#2E1E14",
            // Background — Latte cream
            "--color-cream-50": "#FAF5EF",
            "--color-cream-100": "#F3EADD",
            "--color-cream-200": "#EAD9C5",
            "--color-cream-300": "#DCC8AC",
            "--color-cream-400": "#C4AD90",
            "--color-cream-500": "#A89074",
            // Accent — Olive/Sage Green
            "--color-wine-50": "#F4F6EE",
            "--color-wine-100": "#E6EADB",
            "--color-wine-200": "#CED8B2",
            "--color-wine-300": "#AAB97E",
            "--color-wine-400": "#8DA058",
            "--color-wine-500": "#6B7B3A",
            "--color-wine-600": "#596830",
            "--color-wine-700": "#495528",
            "--color-wine-800": "#3C4620",
            "--color-wine-900": "#303818",
        },
    },
    {
        id: "noir",
        name: "Noir",
        nameVi: "Bóng Đêm",
        description: "Đen tuyền + Vàng gold — Sang trọng & bí ẩn",
        preview: { primary: "#141414", sidebar: "#141414", accent: "#C8A96E", bg: "#F5F3F0" },
        vars: {
            // Primary — True Black
            "--color-green-50": "#ECECEC",
            "--color-green-100": "#DCDCDC",
            "--color-green-200": "#B8B8B8",
            "--color-green-300": "#888888",
            "--color-green-400": "#5C5C5C",
            "--color-green-500": "#3D3D3D",
            "--color-green-600": "#2E2E2E",
            "--color-green-700": "#222222",
            "--color-green-800": "#1A1A1A",
            "--color-green-900": "#141414",
            // Background — Warm off-white
            "--color-cream-50": "#F5F3F0",
            "--color-cream-100": "#EBE7E1",
            "--color-cream-200": "#DEDAD2",
            "--color-cream-300": "#CCC6BB",
            "--color-cream-400": "#B0A898",
            "--color-cream-500": "#948C7C",
            // Accent — Gold
            "--color-wine-50": "#FBF7EE",
            "--color-wine-100": "#F3EACC",
            "--color-wine-200": "#E4D49A",
            "--color-wine-300": "#D4BC6E",
            "--color-wine-400": "#C8A96E",
            "--color-wine-500": "#A88C4A",
            "--color-wine-600": "#8C7438",
            "--color-wine-700": "#725E2C",
            "--color-wine-800": "#5C4C24",
            "--color-wine-900": "#4A3C1C",
        },
    },
]

interface ThemeState {
    themeId: ThemeId
    setTheme: (id: ThemeId) => void
    applyTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            themeId: "forest",
            setTheme: (id) => {
                set({ themeId: id })
                applyThemeVars(id)
            },
            applyTheme: () => {
                applyThemeVars(get().themeId)
            },
        }),
        { name: "noonnoir-theme" }
    )
)

function applyThemeVars(id: ThemeId) {
    const theme = THEMES.find((t) => t.id === id)
    if (!theme) return

    // Remove old theme style tag
    const oldStyle = document.getElementById("noonnoir-theme-override")
    if (oldStyle) oldStyle.remove()

    // If it's the default forest theme, no override needed
    if (id === "forest") return

    // Build CSS overrides for ALL Tailwind utilities that reference green/cream/wine colors
    const vars = theme.vars
    const lines: string[] = []

    // Map CSS variable names to color scale entries  
    const colorMap: Record<string, string> = {}
    for (const [varName, value] of Object.entries(vars)) {
        colorMap[varName] = value
    }

    // Generate override rules for each color token
    const greenShades = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"]
    const creamShades = ["50", "100", "200", "300", "400", "500"]
    const wineShades = ["50", "100", "200", "300", "400", "500", "600", "700", "800", "900"]

    for (const shade of greenShades) {
        const v = colorMap[`--color-green-${shade}`]
        if (!v) continue
        lines.push(`
            .bg-green-${shade} { background-color: ${v} !important; }
            .text-green-${shade} { color: ${v} !important; }
            .border-green-${shade} { border-color: ${v} !important; }
            .ring-green-${shade} { --tw-ring-color: ${v} !important; }
            .hover\\:bg-green-${shade}:hover { background-color: ${v} !important; }
            .hover\\:text-green-${shade}:hover { color: ${v} !important; }
            .hover\\:border-green-${shade}:hover { border-color: ${v} !important; }
        `)
    }

    for (const shade of creamShades) {
        const v = colorMap[`--color-cream-${shade}`]
        if (!v) continue
        lines.push(`
            .bg-cream-${shade} { background-color: ${v} !important; }
            .text-cream-${shade} { color: ${v} !important; }
            .border-cream-${shade} { border-color: ${v} !important; }
            .hover\\:bg-cream-${shade}:hover { background-color: ${v} !important; }
            .hover\\:text-cream-${shade}:hover { color: ${v} !important; }
        `)
    }

    for (const shade of wineShades) {
        const v = colorMap[`--color-wine-${shade}`]
        if (!v) continue
        lines.push(`
            .bg-wine-${shade} { background-color: ${v} !important; }
            .text-wine-${shade} { color: ${v} !important; }
            .border-wine-${shade} { border-color: ${v} !important; }
            .hover\\:bg-wine-${shade}:hover { background-color: ${v} !important; }
            .hover\\:text-wine-${shade}:hover { color: ${v} !important; }
        `)
    }

    // Also override body & root colors
    lines.push(`
        body { background-color: ${vars["--color-cream-50"]} !important; color: ${vars["--color-green-900"]} !important; }
        :root {
            --sidebar: ${vars["--color-green-900"]};
            --sidebar-foreground: ${vars["--color-cream-50"]};
            --sidebar-accent: ${vars["--color-green-700"]};
            --sidebar-border: ${vars["--color-green-800"]};
            --primary: ${vars["--color-green-900"]};
            --primary-foreground: ${vars["--color-cream-50"]};
            --background: ${vars["--color-cream-50"]};
            --foreground: ${vars["--color-green-900"]};
            --accent: ${vars["--color-wine-700"]};
            --border: ${vars["--color-cream-300"]};
            --ring: ${vars["--color-green-700"]};
        }
    `)

    // Also override opacity variants
    for (const shade of greenShades) {
        const v = colorMap[`--color-green-${shade}`]
        if (!v) continue
        lines.push(`.bg-green-${shade}\\/20 { background-color: ${hexToRgba(v, 0.2)} !important; }`)
        lines.push(`.bg-green-${shade}\\/10 { background-color: ${hexToRgba(v, 0.1)} !important; }`)
        lines.push(`.text-green-${shade}\\/80 { color: ${hexToRgba(v, 0.8)} !important; }`)
    }
    for (const shade of wineShades) {
        const v = colorMap[`--color-wine-${shade}`]
        if (!v) continue
        lines.push(`.bg-wine-${shade}\\/20 { background-color: ${hexToRgba(v, 0.2)} !important; }`)
        lines.push(`.bg-wine-${shade}\\/50 { background-color: ${hexToRgba(v, 0.5)} !important; }`)
        lines.push(`.text-wine-${shade}\\/80 { color: ${hexToRgba(v, 0.8)} !important; }`)
    }

    // Inject style tag
    const styleEl = document.createElement("style")
    styleEl.id = "noonnoir-theme-override"
    styleEl.textContent = lines.join("\n")
    document.head.appendChild(styleEl)
}

function hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

