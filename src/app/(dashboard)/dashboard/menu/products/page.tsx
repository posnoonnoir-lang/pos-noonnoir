import { getProducts, getCategories } from "@/actions/menu"
import ProductsClient from "./products-client"

export const dynamic = "force-dynamic"

export default async function ProductsPage() {
    const [products, categories] = await Promise.all([
        getProducts(),
        getCategories(),
    ])
    return <ProductsClient initialProducts={products} initialCategories={categories} />
}
