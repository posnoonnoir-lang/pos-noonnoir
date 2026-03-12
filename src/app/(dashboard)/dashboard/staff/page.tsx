import { getStaffList } from "@/actions/staff"
import { getTodayAttendance } from "@/actions/attendance"
import { StaffClient } from "./staff-client"

export const dynamic = "force-dynamic"

export default async function StaffPage() {
    try {
        const [list, attendance] = await Promise.all([getStaffList(), getTodayAttendance()])
        return <StaffClient initialData={{ list, attendance }} />
    } catch (e) {
        console.error("[StaffPage SSR] Failed:", e)
        return <StaffClient initialData={{ list: [], attendance: [] }} />
    }
}
