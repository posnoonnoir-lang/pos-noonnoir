"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"

export type HrConfigData = {
    // Shift definitions
    shifts: {
        key: string
        label: string
        startTime: string
        endTime: string
        color: string
        isActive: boolean
    }[]

    // Attendance rules
    attendance: {
        lateTolerance: number // minutes after shift start
        absentThreshold: number // minutes after shift start to mark absent
        autoCheckoutHour: string // auto checkout time if forgotten
        minWorkHours: number // minimum hours for a full working day
        requirePhoto: boolean
    }

    // Payroll settings
    payroll: {
        standardHoursPerDay: number
        overtimeMultiplier: number
        nightShiftMultiplier: number
        bonusEnabled: boolean
        bonusType: "FIXED" | "PERCENT_REVENUE"
        bonusThreshold: number // min revenue to trigger bonus
        bonusValue: number // fixed amount or percentage
        payDay: number // day of month for salary payment
        includeServiceCharge: boolean
        serviceChargePercent: number // % of tips/service charge to staff
    }

    // Leave policy
    leave: {
        annualLeaveDays: number
        sickLeaveDays: number
        carryOverEnabled: boolean
        maxCarryOverDays: number
        requireApproval: boolean
    }

    // Roles & salary ranges
    roles: {
        key: string
        label: string
        minSalary: number
        maxSalary: number
    }[]
}

const DEFAULT_HR_CONFIG: HrConfigData = {
    shifts: [
        { key: "MORNING", label: "Ca sáng", startTime: "08:00", endTime: "14:00", color: "#f59e0b", isActive: true },
        { key: "AFTERNOON", label: "Ca chiều", startTime: "14:00", endTime: "22:00", color: "#3b82f6", isActive: true },
        { key: "EVENING", label: "Ca tối", startTime: "17:00", endTime: "23:00", color: "#8b5cf6", isActive: true },
        { key: "FULL", label: "Cả ngày", startTime: "10:00", endTime: "22:00", color: "#22c55e", isActive: true },
    ],
    attendance: {
        lateTolerance: 15,
        absentThreshold: 120,
        autoCheckoutHour: "23:59",
        minWorkHours: 8,
        requirePhoto: false,
    },
    payroll: {
        standardHoursPerDay: 8,
        overtimeMultiplier: 1.5,
        nightShiftMultiplier: 1.3,
        bonusEnabled: true,
        bonusType: "PERCENT_REVENUE",
        bonusThreshold: 5000000,
        bonusValue: 1,
        payDay: 5,
        includeServiceCharge: false,
        serviceChargePercent: 50,
    },
    leave: {
        annualLeaveDays: 12,
        sickLeaveDays: 3,
        carryOverEnabled: false,
        maxCarryOverDays: 5,
        requireApproval: true,
    },
    roles: [
        { key: "MANAGER", label: "Quản lý", minSalary: 12000000, maxSalary: 25000000 },
        { key: "BARTENDER", label: "Bartender", minSalary: 8000000, maxSalary: 15000000 },
        { key: "SOMMELIER", label: "Sommelier", minSalary: 10000000, maxSalary: 20000000 },
        { key: "SERVER", label: "Phục vụ", minSalary: 6000000, maxSalary: 12000000 },
    ],
}

const HR_CONFIG_KEY = "hr_config"

export async function getHrConfig(): Promise<HrConfigData> {
    try {
        const record = await prisma.systemSetting.findUnique({
            where: { key: HR_CONFIG_KEY },
        })
        if (record?.value) {
            return { ...DEFAULT_HR_CONFIG, ...(record.value as object) } as HrConfigData
        }
    } catch {
        // system_setting table might not exist yet, use default
    }
    return DEFAULT_HR_CONFIG
}

export async function updateHrConfig(data: Partial<HrConfigData>) {
    try {
        const current = await getHrConfig()
        const merged = { ...current, ...data }
        const jsonValue = JSON.parse(JSON.stringify(merged))

        await prisma.systemSetting.upsert({
            where: { key: HR_CONFIG_KEY },
            create: {
                key: HR_CONFIG_KEY,
                value: jsonValue,
            },
            update: {
                value: jsonValue,
            },
        })

        revalidatePath("/dashboard/settings")
        revalidatePath("/dashboard/staff")
        return { success: true }
    } catch (error) {
        return { success: false, error: String(error) }
    }
}
