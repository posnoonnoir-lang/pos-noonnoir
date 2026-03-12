import { getInventory, getInventoryStats, getStockMovements } from "@/actions/inventory"
import {
    getRawMaterials,
    getRawMaterialStats,
    getRecipes,
    getEquipment,
    getEquipmentStats,
    getDepreciationHistory,
} from "@/actions/assets"
import { InventoryClient, type InventoryInitialData } from "./inventory-client"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
    let initialData: InventoryInitialData = {
        items: [],
        stats: { totalItems: 0, inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0, expiringSoon: 0, totalBottles: 0, inStockBottles: 0, openedBottles: 0, totalIngredients: 0, lowStockAlerts: 0 },
        movements: [],
        materials: [],
        nplStats: { totalItems: 0, inStock: 0, lowStock: 0, outOfStock: 0, totalValue: 0, expiringSoon: 0, categories: 0 },
        recipes: [],
        equipment: [],
        eqStats: { totalItems: 0, activeItems: 0, totalOriginalValue: 0, totalAccumulatedDep: 0, totalNetBookValue: 0, monthlyDepTotal: 0, maintenanceCount: 0, categories: 0 },
        depHistory: [],
    }

    try {
        const [items, stats, movements, materials, nplStats, recipes, equipment, eqStats, depHistory] = await Promise.all([
            getInventory(),
            getInventoryStats(),
            getStockMovements(),
            getRawMaterials(),
            getRawMaterialStats(),
            getRecipes(),
            getEquipment(),
            getEquipmentStats(),
            getDepreciationHistory(),
        ])
        initialData = { items, stats, movements, materials, nplStats, recipes, equipment, eqStats, depHistory }
    } catch (e) {
        console.error("[InventoryPage SSR] Failed to fetch data:", e)
    }

    return <InventoryClient initialData={initialData} />
}
