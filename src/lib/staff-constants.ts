import type { StaffRole } from "@prisma/client"

export type { StaffRole } from "@prisma/client"
export type StaffStatus = "ACTIVE" | "INACTIVE" | "ON_LEAVE"

export const ROLE_LABELS: Record<StaffRole, string> = {
    OWNER: "Chủ quán",
    MANAGER: "Quản lý",
    BARTENDER: "Bartender",
    CASHIER: "Thu ngân",
    WAITER: "Phục vụ",
    KITCHEN: "Bếp",
}

export const STATUS_LABELS: Record<StaffStatus, string> = {
    ACTIVE: "Đang làm",
    INACTIVE: "Nghỉ việc",
    ON_LEAVE: "Nghỉ phép",
}
