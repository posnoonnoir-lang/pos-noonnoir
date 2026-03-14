import { getCategories } from "@/actions/menu"
import CategoriesClient from "./categories/categories-client"

export const dynamic = "force-dynamic"

export default async function MenuPage() {
    const categories = await getCategories()
    return <CategoriesClient initialCategories={categories} />
}
