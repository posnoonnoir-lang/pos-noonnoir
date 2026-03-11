"use client"

import { useState, useEffect, useCallback } from "react"
import {
    Users,
    UserPlus,
    Search,
    Shield,
    Phone,
    Mail,
    Clock,
    Award,
    X,
    ChevronDown,
    KeyRound,
    UserCheck,
    UserX,
    Palmtree,
    RefreshCcw,
    Wine,
    ChefHat,
    Martini,
    HandPlatter,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    getStaffList,
    createStaff,
    updateStaff,
    updateStaffStatus,
    resetStaffPin,
    type Staff,
    type StaffRole,
    type StaffStatus,
} from "@/actions/staff"
import { ROLE_LABELS, STATUS_LABELS } from "@/lib/staff-constants"

function formatPrice(amount: number): string {
    return new Intl.NumberFormat("vi-VN").format(amount)
}

function formatCompact(amount: number): string {
    if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`
    if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`
    return String(amount)
}

const ROLE_ICONS: Record<StaffRole, typeof Wine> = {
    OWNER: Wine,
    MANAGER: Shield,
    BARTENDER: Martini,
    CASHIER: Award,
    WAITER: HandPlatter,
    KITCHEN: ChefHat,
}

const ROLE_COLORS: Record<StaffRole, string> = {
    OWNER: "bg-wine-100 text-wine-700 border-wine-300",
    MANAGER: "bg-blue-100 text-blue-700 border-blue-300",
    BARTENDER: "bg-amber-100 text-amber-700 border-amber-300",
    CASHIER: "bg-teal-100 text-teal-700 border-teal-300",
    WAITER: "bg-green-100 text-green-700 border-green-300",
    KITCHEN: "bg-orange-100 text-orange-700 border-orange-300",
}

const STATUS_COLORS: Record<StaffStatus, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    INACTIVE: "bg-red-100 text-red-700",
    ON_LEAVE: "bg-amber-100 text-amber-700",
}

export default function StaffPage() {
    const [staffList, setStaffList] = useState<Staff[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [roleFilter, setRoleFilter] = useState<StaffRole | "ALL">("ALL")
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
    const [showPinReset, setShowPinReset] = useState<string | null>(null)
    const [newPin, setNewPin] = useState("")

    const loadStaff = useCallback(async () => {
        setLoading(true)
        const data = await getStaffList()
        setStaffList(data)
        setLoading(false)
    }, [])

    useEffect(() => {
        loadStaff()
    }, [loadStaff])

    const filtered = staffList.filter((s) => {
        const matchSearch =
            !searchTerm ||
            s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.phone.includes(searchTerm)
        const matchRole = roleFilter === "ALL" || s.role === roleFilter
        return matchSearch && matchRole
    })

    const stats = {
        total: staffList.length,
        active: staffList.filter((s) => s.status === "ACTIVE").length,
        onLeave: staffList.filter((s) => s.status === "ON_LEAVE").length,
    }

    const handleStatusChange = async (id: string, status: StaffStatus) => {
        const result = await updateStaffStatus(id, status)
        if (result.success) {
            toast.success("Cập nhật trạng thái thành công")
            loadStaff()
            setSelectedStaff(null)
        }
    }

    const handlePinReset = async () => {
        if (!showPinReset) return
        const result = await resetStaffPin(showPinReset, newPin)
        if (result.success) {
            toast.success("Đặt lại PIN thành công")
            setShowPinReset(null)
            setNewPin("")
        } else {
            toast.error(result.error ?? "Lỗi")
        }
    }

    return (
        <div className="min-h-screen bg-cream-50 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                        <Users className="h-5 w-5 text-green-700" />
                    </div>
                    <div>
                        <h1 className="font-display text-2xl font-bold text-green-900">Nhân sự</h1>
                        <p className="text-sm text-cream-500">Quản lý nhân viên Noon & Noir</p>
                    </div>
                </div>
                <Button
                    onClick={() => setShowAddModal(true)}
                    className="bg-green-900 text-cream-50 hover:bg-green-800"
                >
                    <UserPlus className="mr-1.5 h-4 w-4" />
                    Thêm nhân viên
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Tổng nhân viên", value: stats.total, icon: Users, color: "text-green-900" },
                    { label: "Đang làm việc", value: stats.active, icon: UserCheck, color: "text-green-600" },
                    { label: "Nghỉ phép", value: stats.onLeave, icon: Palmtree, color: "text-amber-600" },
                ].map((stat) => {
                    const Icon = stat.icon
                    return (
                        <div key={stat.label} className="rounded-xl border border-cream-300 bg-cream-100 p-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className="h-4 w-4 text-cream-400" />
                                <span className="text-[10px] text-cream-400">{stat.label}</span>
                            </div>
                            <p className={cn("font-mono text-2xl font-bold", stat.color)}>{stat.value}</p>
                        </div>
                    )
                })}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 mb-4">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cream-400" />
                    <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm tên, email, SĐT..."
                        className="h-9 pl-8 text-xs border-cream-300"
                    />
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => setRoleFilter("ALL")}
                        className={cn(
                            "rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all",
                            roleFilter === "ALL" ? "bg-green-900 text-cream-50" : "bg-cream-200 text-cream-500"
                        )}
                    >
                        Tất cả
                    </button>
                    {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                        <button
                            key={role}
                            onClick={() => setRoleFilter(role)}
                            className={cn(
                                "rounded-md px-2.5 py-1.5 text-[10px] font-medium transition-all",
                                roleFilter === role ? "bg-green-900 text-cream-50" : "bg-cream-200 text-cream-500"
                            )}
                        >
                            {ROLE_LABELS[role]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Staff Grid */}
            <div className="grid grid-cols-3 gap-4">
                {filtered.map((staff) => {
                    const RoleIcon = ROLE_ICONS[staff.role]
                    const isSelected = selectedStaff?.id === staff.id
                    return (
                        <button
                            key={staff.id}
                            onClick={() => setSelectedStaff(isSelected ? null : staff)}
                            className={cn(
                                "rounded-xl border bg-cream-100 p-4 text-left transition-all hover:shadow-md",
                                isSelected
                                    ? "border-green-700 ring-2 ring-green-200"
                                    : "border-cream-300"
                            )}
                        >
                            {/* Header */}
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-900 text-cream-50 font-display font-bold text-sm">
                                        {staff.fullName.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-green-900">{staff.fullName}</p>
                                        <span className={cn(
                                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-medium mt-0.5",
                                            ROLE_COLORS[staff.role]
                                        )}>
                                            <RoleIcon className="h-2.5 w-2.5" />
                                            {ROLE_LABELS[staff.role]}
                                        </span>
                                    </div>
                                </div>
                                <span className={cn(
                                    "rounded-full px-2 py-0.5 text-[9px] font-bold",
                                    STATUS_COLORS[staff.status]
                                )}>
                                    {STATUS_LABELS[staff.status]}
                                </span>
                            </div>

                            {/* Contact */}
                            <div className="space-y-1 mb-3">
                                <p className="flex items-center gap-1.5 text-[10px] text-cream-500">
                                    <Phone className="h-3 w-3" /> {staff.phone}
                                </p>
                                <p className="flex items-center gap-1.5 text-[10px] text-cream-500">
                                    <Mail className="h-3 w-3" /> {staff.email}
                                </p>
                                <p className="flex items-center gap-1.5 text-[10px] text-cream-500">
                                    <Clock className="h-3 w-3" /> Ca: {staff.shiftStart} — {staff.shiftEnd}
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-lg bg-cream-50 px-2.5 py-1.5 text-center">
                                    <p className="font-mono text-xs font-bold text-green-900">{staff.totalOrders}</p>
                                    <p className="text-[8px] text-cream-400">đơn hàng</p>
                                </div>
                                <div className="rounded-lg bg-cream-50 px-2.5 py-1.5 text-center">
                                    <p className="font-mono text-xs font-bold text-wine-700">₫{formatCompact(staff.totalRevenue)}</p>
                                    <p className="text-[8px] text-cream-400">doanh thu</p>
                                </div>
                            </div>
                        </button>
                    )
                })}
            </div>

            {/* Empty state */}
            {filtered.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center py-16">
                    <Users className="h-12 w-12 text-cream-300 mb-3" />
                    <p className="text-sm text-cream-400">Không tìm thấy nhân viên</p>
                </div>
            )}

            {/* Selected Staff Actions Panel */}
            {selectedStaff && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
                    <div className="flex items-center gap-2 rounded-xl border border-cream-300 bg-cream-50 px-4 py-3 shadow-xl">
                        <span className="text-xs font-bold text-green-900 mr-2">
                            {selectedStaff.fullName}
                        </span>
                        <div className="h-4 w-px bg-cream-300" />
                        {selectedStaff.status !== "ACTIVE" && (
                            <button
                                onClick={() => handleStatusChange(selectedStaff.id, "ACTIVE")}
                                className="flex items-center gap-1 rounded-lg bg-green-100 px-3 py-1.5 text-[10px] font-bold text-green-700 hover:bg-green-200 transition-all"
                            >
                                <UserCheck className="h-3 w-3" /> Kích hoạt
                            </button>
                        )}
                        {selectedStaff.status === "ACTIVE" && (
                            <button
                                onClick={() => handleStatusChange(selectedStaff.id, "ON_LEAVE")}
                                className="flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1.5 text-[10px] font-bold text-amber-700 hover:bg-amber-200 transition-all"
                            >
                                <Palmtree className="h-3 w-3" /> Cho nghỉ phép
                            </button>
                        )}
                        <button
                            onClick={() => {
                                setEditingStaff(selectedStaff)
                            }}
                            className="flex items-center gap-1 rounded-lg bg-cream-200 px-3 py-1.5 text-[10px] font-bold text-green-900 hover:bg-cream-300 transition-all"
                        >
                            <RefreshCcw className="h-3 w-3" /> Sửa
                        </button>
                        <button
                            onClick={() => {
                                setShowPinReset(selectedStaff.id)
                                setNewPin("")
                            }}
                            className="flex items-center gap-1 rounded-lg bg-blue-100 px-3 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-200 transition-all"
                        >
                            <KeyRound className="h-3 w-3" /> Đổi PIN
                        </button>
                        {selectedStaff.status !== "INACTIVE" && selectedStaff.role !== "OWNER" && (
                            <button
                                onClick={() => handleStatusChange(selectedStaff.id, "INACTIVE")}
                                className="flex items-center gap-1 rounded-lg bg-red-100 px-3 py-1.5 text-[10px] font-bold text-red-700 hover:bg-red-200 transition-all"
                            >
                                <UserX className="h-3 w-3" /> Nghỉ việc
                            </button>
                        )}
                        <button
                            onClick={() => setSelectedStaff(null)}
                            className="ml-1 rounded-lg p-1.5 text-cream-400 hover:bg-cream-200 transition-all"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* PIN Reset Modal */}
            {showPinReset && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="w-[320px] rounded-xl bg-cream-50 p-6 shadow-2xl">
                        <h3 className="font-display text-lg font-bold text-green-900 mb-1">Đặt lại PIN</h3>
                        <p className="text-xs text-cream-500 mb-4">Nhập mã PIN mới (4 chữ số)</p>
                        <Input
                            value={newPin}
                            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            placeholder="• • • •"
                            maxLength={4}
                            className="text-center font-mono text-2xl tracking-[0.5em] border-cream-300 mb-4"
                        />
                        <div className="flex gap-2">
                            <Button
                                onClick={handlePinReset}
                                disabled={newPin.length < 4}
                                className="flex-1 bg-green-900 text-cream-50 hover:bg-green-800"
                            >
                                Xác nhận
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => { setShowPinReset(null); setNewPin("") }}
                                className="border-cream-300 text-cream-500"
                            >
                                Huỷ
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Staff Modal */}
            {showAddModal && (
                <AddStaffModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => { setShowAddModal(false); loadStaff() }}
                />
            )}

            {/* Edit Staff Modal */}
            {editingStaff && (
                <EditStaffModal
                    staff={editingStaff}
                    onClose={() => setEditingStaff(null)}
                    onSuccess={() => { setEditingStaff(null); setSelectedStaff(null); loadStaff() }}
                />
            )}
        </div>
    )
}

function AddStaffModal({
    onClose,
    onSuccess,
}: {
    onClose: () => void
    onSuccess: () => void
}) {
    const [form, setForm] = useState({
        fullName: "",
        pin: "",
        role: "WAITER" as StaffRole,
        phone: "",
        email: "",
        shiftStart: "10:00",
        shiftEnd: "22:00",
    })
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!form.fullName || !form.pin || !form.phone) {
            toast.error("Vui lòng nhập đầy đủ thông tin")
            return
        }
        setSubmitting(true)
        const result = await createStaff(form)
        if (result.success) {
            toast.success(`Đã thêm ${form.fullName}`)
            onSuccess()
        } else {
            toast.error(result.error ?? "Lỗi")
        }
        setSubmitting(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[420px] rounded-xl bg-cream-50 shadow-2xl">
                <div className="flex items-center justify-between border-b border-cream-200 px-6 py-4">
                    <h3 className="font-display text-lg font-bold text-green-900">Thêm nhân viên</h3>
                    <button onClick={onClose} className="rounded-lg p-1 text-cream-400 hover:bg-cream-200">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-6 space-y-3">
                    <div>
                        <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">Họ tên *</label>
                        <Input
                            value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                            placeholder="Nguyễn Văn A"
                            className="mt-1 border-cream-300"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">Mã PIN *</label>
                            <Input
                                value={form.pin}
                                onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                                placeholder="4 chữ số"
                                maxLength={4}
                                className="mt-1 font-mono border-cream-300"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">Vai trò *</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                                className="mt-1 w-full rounded-md border border-cream-300 bg-cream-50 px-3 py-2 text-sm"
                            >
                                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">SĐT *</label>
                            <Input
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                placeholder="0901234567"
                                className="mt-1 border-cream-300"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">Email</label>
                            <Input
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                placeholder="name@noonnoir.vn"
                                className="mt-1 border-cream-300"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">Ca bắt đầu</label>
                            <Input
                                type="time"
                                value={form.shiftStart}
                                onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
                                className="mt-1 border-cream-300"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">Ca kết thúc</label>
                            <Input
                                type="time"
                                value={form.shiftEnd}
                                onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })}
                                className="mt-1 border-cream-300"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 border-t border-cream-200 px-6 py-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 bg-green-900 text-cream-50 hover:bg-green-800"
                    >
                        {submitting ? "Đang thêm..." : "Thêm nhân viên"}
                    </Button>
                    <Button variant="outline" onClick={onClose} className="border-cream-300 text-cream-500">
                        Huỷ
                    </Button>
                </div>
            </div>
        </div>
    )
}

// ============================================================
// EDIT STAFF MODAL
// ============================================================
function EditStaffModal({
    staff,
    onClose,
    onSuccess,
}: {
    staff: Staff
    onClose: () => void
    onSuccess: () => void
}) {
    const [form, setForm] = useState({
        fullName: staff.fullName,
        role: staff.role as StaffRole,
        phone: staff.phone,
        email: staff.email,
        shiftStart: staff.shiftStart,
        shiftEnd: staff.shiftEnd,
    })
    const [submitting, setSubmitting] = useState(false)

    const handleSubmit = async () => {
        if (!form.fullName || !form.phone) {
            toast.error("Vui lòng nhập đầy đủ thông tin")
            return
        }
        setSubmitting(true)
        const result = await updateStaff(staff.id, form)
        if (result.success) {
            toast.success(`Đã cập nhật ${form.fullName}`)
            onSuccess()
        } else {
            toast.error(result.error ?? "Lỗi")
        }
        setSubmitting(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-[420px] rounded-xl bg-cream-50 shadow-2xl">
                <div className="flex items-center justify-between border-b border-cream-200 px-6 py-4">
                    <div>
                        <h3 className="font-display text-lg font-bold text-green-900">Chỉnh sửa nhân viên</h3>
                        <p className="text-[10px] text-cream-400">{staff.fullName} · {ROLE_LABELS[staff.role]}</p>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1 text-cream-400 hover:bg-cream-200">
                        <X className="h-4 w-4" />
                    </button>
                </div>
                <div className="p-6 space-y-3">
                    <div>
                        <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">Họ tên *</label>
                        <Input
                            value={form.fullName}
                            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                            className="mt-1 border-cream-300"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">Vai trò</label>
                            <select
                                value={form.role}
                                onChange={(e) => setForm({ ...form, role: e.target.value as StaffRole })}
                                className="mt-1 w-full rounded-md border border-cream-300 bg-cream-50 px-3 py-2 text-sm"
                            >
                                {(Object.keys(ROLE_LABELS) as StaffRole[]).map((role) => (
                                    <option key={role} value={role}>{ROLE_LABELS[role]}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">SĐT *</label>
                            <Input
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="mt-1 border-cream-300"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">Email</label>
                        <Input
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className="mt-1 border-cream-300"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">Ca bắt đầu</label>
                            <Input
                                type="time"
                                value={form.shiftStart}
                                onChange={(e) => setForm({ ...form, shiftStart: e.target.value })}
                                className="mt-1 border-cream-300"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-cream-400 uppercase tracking-wider">Ca kết thúc</label>
                            <Input
                                type="time"
                                value={form.shiftEnd}
                                onChange={(e) => setForm({ ...form, shiftEnd: e.target.value })}
                                className="mt-1 border-cream-300"
                            />
                        </div>
                    </div>
                </div>
                <div className="flex gap-2 border-t border-cream-200 px-6 py-4">
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 bg-green-900 text-cream-50 hover:bg-green-800"
                    >
                        {submitting ? "Đang lưu..." : "Lưu thay đổi"}
                    </Button>
                    <Button variant="outline" onClick={onClose} className="border-cream-300 text-cream-500">
                        Huỷ
                    </Button>
                </div>
            </div>
        </div>
    )
}
