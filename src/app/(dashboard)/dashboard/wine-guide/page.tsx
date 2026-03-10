"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Wine,
    Search,
    Thermometer,
    Clock,
    GlassWater,
    Utensils,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    Grape,
    MapPin,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    getAllServingNotes,
    searchServingNotes,
    type WineServingNote,
} from "@/actions/serving-notes"

export default function WineGuidePage() {
    const [notes, setNotes] = useState<WineServingNote[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [expandedId, setExpandedId] = useState<string | null>(null)

    const loadData = useCallback(async () => {
        setLoading(true)
        const list = search ? await searchServingNotes(search) : await getAllServingNotes()
        setNotes(list)
        setLoading(false)
    }, [search])

    useEffect(() => { loadData() }, [loadData])

    return (
        <div className="min-h-screen bg-cream-50 p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-wine-100">
                        <Wine className="h-5 w-5 text-wine-700" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-green-900">Wine Guide</h1>
                        <p className="text-sm text-cream-500">Hướng dẫn phục vụ, tasting notes, food pairing</p>
                    </div>
                </div>
                <div className="relative max-w-xs w-64">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream-400" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Tìm rượu, vùng, nho, pairing..."
                        className="h-8 pl-8 text-xs border-cream-300 bg-white"
                    />
                </div>
            </div>

            {/* Wine Cards */}
            <div className="space-y-3">
                {notes.map((note) => {
                    const isExpanded = expandedId === note.id
                    return (
                        <div key={note.id} className="rounded-xl border border-cream-200 bg-white shadow-sm overflow-hidden hover:shadow-md transition-all">
                            {/* Collapsed row */}
                            <button
                                onClick={() => setExpandedId(isExpanded ? null : note.id)}
                                className={cn("w-full flex items-center px-5 py-4 text-left transition-colors", isExpanded && "bg-wine-50")}
                            >
                                {/* Wine icon */}
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-wine-100 border border-wine-200 mr-4 shrink-0">
                                    <Wine className="h-5 w-5 text-wine-700" />
                                </div>

                                {/* Name + Region */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-green-900">{note.productName}</span>
                                        {note.vintage && <Badge className="text-[8px] bg-wine-100 border-wine-300 text-wine-700">{note.vintage}</Badge>}
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="flex items-center gap-1 text-[11px] text-cream-500"><MapPin className="h-3 w-3" />{note.region}</span>
                                        <span className="flex items-center gap-1 text-[11px] text-cream-500"><Grape className="h-3 w-3" />{note.grape}</span>
                                    </div>
                                </div>

                                {/* Quick info */}
                                <div className="hidden lg:flex items-center gap-3 mr-4">
                                    <div className="flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 py-1">
                                        <Thermometer className="h-3 w-3 text-blue-600" />
                                        <span className="text-[10px] font-bold text-blue-700">{note.servingTemp}</span>
                                    </div>
                                    <div className="flex items-center gap-1 rounded-lg bg-cream-100 border border-cream-200 px-2 py-1">
                                        <GlassWater className="h-3 w-3 text-cream-500" />
                                        <span className="text-[10px] font-medium text-cream-600">{note.glassType.split(" ")[0]}</span>
                                    </div>
                                    {note.decantTime && (
                                        <div className="flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-200 px-2 py-1">
                                            <Clock className="h-3 w-3 text-amber-600" />
                                            <span className="text-[10px] font-medium text-amber-700">Decant</span>
                                        </div>
                                    )}
                                </div>

                                {/* Pairing count */}
                                <div className="flex items-center gap-1 mr-3">
                                    <Utensils className="h-3 w-3 text-cream-400" />
                                    <span className="text-[10px] text-cream-400">{note.pairings.length} pairings</span>
                                </div>

                                <div className="w-5">{isExpanded ? <ChevronUp className="h-4 w-4 text-cream-400" /> : <ChevronDown className="h-4 w-4 text-cream-400" />}</div>
                            </button>

                            {/* Expanded detail */}
                            {isExpanded && (
                                <div className="border-t border-cream-200 bg-cream-50 px-5 py-5">
                                    <div className="grid grid-cols-3 gap-5">
                                        {/* Left: Serving Info */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-bold uppercase text-cream-400">HƯỚNG DẪN PHỤC VỤ</h4>
                                            <div className="rounded-lg bg-white border border-cream-200 p-3 space-y-2.5">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-cream-500 flex items-center gap-1.5"><Thermometer className="h-3 w-3" /> Nhiệt độ</span>
                                                    <span className="font-bold text-blue-700">{note.servingTemp}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-cream-500 flex items-center gap-1.5"><GlassWater className="h-3 w-3" /> Ly</span>
                                                    <span className="font-medium">{note.glassType}</span>
                                                </div>
                                                {note.decantTime && (
                                                    <div className="flex justify-between text-xs">
                                                        <span className="text-cream-500 flex items-center gap-1.5"><Clock className="h-3 w-3" /> Decant</span>
                                                        <span className="font-bold text-amber-700">{note.decantTime}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-cream-500 flex items-center gap-1.5"><MapPin className="h-3 w-3" /> Vùng</span>
                                                    <span className="font-medium">{note.region}</span>
                                                </div>
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-cream-500 flex items-center gap-1.5"><Grape className="h-3 w-3" /> Nho</span>
                                                    <span className="font-medium text-right max-w-[140px]">{note.grape}</span>
                                                </div>
                                            </div>

                                            {/* Staff notes */}
                                            {note.staffNotes && (
                                                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                                                    <p className="text-[9px] font-bold uppercase text-amber-500 mb-1 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> GHI CHÚ NHÂN VIÊN</p>
                                                    <p className="text-[11px] text-amber-800 leading-relaxed">{note.staffNotes}</p>
                                                    <p className="text-[9px] text-amber-400 mt-1.5">— {note.addedBy}, {new Date(note.updatedAt).toLocaleDateString("vi-VN")}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Middle: Tasting Notes */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-bold uppercase text-cream-400">TASTING NOTES</h4>
                                            <div className="rounded-lg bg-white border border-cream-200 p-3 space-y-3">
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase text-wine-400 mb-1.5">👃 Nose (Hương)</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {note.tastingNotes.nose.map((n) => (
                                                            <span key={n} className="rounded-full bg-wine-50 border border-wine-200 px-2 py-0.5 text-[9px] font-medium text-wine-700">{n}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase text-green-500 mb-1.5">👅 Palate (Vị)</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {note.tastingNotes.palate.map((p) => (
                                                            <span key={p} className="rounded-full bg-green-50 border border-green-200 px-2 py-0.5 text-[9px] font-medium text-green-700">{p}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase text-amber-500 mb-1.5">✨ Finish (Kết thúc)</p>
                                                    <p className="text-[11px] text-cream-600 italic">{note.tastingNotes.finish}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Right: Food Pairings */}
                                        <div className="space-y-3">
                                            <h4 className="text-[10px] font-bold uppercase text-cream-400 flex items-center gap-1"><Utensils className="h-3 w-3" /> FOOD PAIRING</h4>
                                            <div className="rounded-lg bg-white border border-cream-200 p-3">
                                                <div className="space-y-1.5">
                                                    {note.pairings.map((p, i) => (
                                                        <div key={i} className="flex items-center gap-2 py-1">
                                                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-[9px] font-bold text-green-700">{i + 1}</span>
                                                            <span className="text-xs text-green-900 font-medium">{p}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Quick suggest section */}
                                            <div className="rounded-lg bg-green-50 border border-green-200 p-3">
                                                <p className="text-[9px] font-bold uppercase text-green-500 mb-1">💡 GỢI Ý UPSELL</p>
                                                <p className="text-[10px] text-green-700 leading-relaxed">
                                                    {note.pairings.length > 2
                                                        ? `Đề xuất kèm "${note.pairings[0]}" hoặc "${note.pairings[1]}" để tăng ticket size.`
                                                        : `Đề xuất kèm "${note.pairings[0]}" cho trải nghiệm tốt nhất.`
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}

                {notes.length === 0 && !loading && (
                    <div className="py-12 text-center text-sm text-cream-400">Không tìm thấy wine serving notes</div>
                )}
            </div>
        </div>
    )
}
