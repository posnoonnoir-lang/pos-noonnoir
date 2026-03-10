import type { StaffRole, StaffStatus } from "@/actions/staff"

export const ROLE_LABELS: Record<StaffRole, string> = {
    OWNER: "Chủ quán",
    MANAGER: "Quản lý",
    BARTENDER: "Bartender",
    SERVER: "Phục vụ",
    KITCHEN: "Bếp",
}

export const STATUS_LABELS: Record<StaffStatus, string> = {
    ACTIVE: "Đang làm",
    INACTIVE: "Nghỉ việc",
    ON_LEAVE: "Nghỉ phép",
}
