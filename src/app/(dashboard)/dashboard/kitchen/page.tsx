import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function KitchenRedirect() {
    redirect("/pos/kitchen")
}
