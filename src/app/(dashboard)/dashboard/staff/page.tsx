import { getStaffList } from "@/actions/staff"
import { getTodayAttendance } from "@/actions/attendance"
import { StaffClient } from "./staff-client"

export default async function StaffPage() {
    const [list, attendance] = await Promise.all([getStaffList(), getTodayAttendance()])
    return <StaffClient initialData={{ list, attendance }} />
}
