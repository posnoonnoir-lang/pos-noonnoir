import { getAllFeedback } from "@/actions/feedback"
import FeedbackClient from "./feedback-client"

export const dynamic = "force-dynamic"

export default async function FeedbackPage() {
    const data = await getAllFeedback()
    return <FeedbackClient initial={data} />
}
