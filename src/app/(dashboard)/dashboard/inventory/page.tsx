import { getInventory, getInventoryStats, getStockMovements } from "@/actions/inventory"
import {
    getRawMaterials,
    getRawMaterialStats,
    getRecipes,
    getEquipment,
    getEquipmentStats,
    getDepreciationHistory,
} from "@/actions/assets"
import { InventoryClient } from "./inventory-client"

export const dynamic = "force-dynamic"

export default async function InventoryPage() {
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

    return (
        <InventoryClient
            initialData={{
                items,
                stats,
                movements,
                materials,
                nplStats,
                recipes,
                equipment,
                eqStats,
                depHistory,
            }}
        />
    )
}
