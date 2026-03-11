import { Wine } from "lucide-react"

export default function POSLoading() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-cream-50">
            <div className="flex flex-col items-center gap-4">
                <div className="relative">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-green-900 shadow-lg">
                        <Wine className="h-8 w-8 text-cream-50 animate-pulse" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-wine-500 animate-bounce" />
                </div>
                <div className="space-y-2 text-center">
                    <p className="font-display text-lg font-bold text-green-900">Noon & Noir</p>
                    <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded-full bg-green-200 animate-pulse" />
                        <div className="h-1 w-12 rounded-full bg-green-300 animate-pulse delay-100" />
                        <div className="h-1 w-6 rounded-full bg-green-200 animate-pulse delay-200" />
                    </div>
                </div>
            </div>
        </div>
    )
}
