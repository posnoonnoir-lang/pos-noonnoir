import { getRecipes } from "@/actions/assets"
import { getProducts } from "@/actions/menu"
import { getRawMaterials } from "@/actions/assets"
import RecipesClient from "./recipes-client"

export const dynamic = "force-dynamic"

export default async function RecipesPage() {
    const [recipes, products, materials] = await Promise.all([
        getRecipes(),
        getProducts(),
        getRawMaterials(),
    ])
    return (
        <RecipesClient
            initialRecipes={recipes}
            initialProducts={products}
            initialMaterials={materials}
        />
    )
}
