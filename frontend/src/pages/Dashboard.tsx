import ScreenLayout from "../layouts/ScreenLayout"
import type { LayoutContextType } from "../layouts/Layout"
import {useOutletContext} from "react-router-dom"
import LowStockItemsCard from "../components/LowStockItemsCard"
import PendingOrdersCard from "../components/PendingOrdersCard"

export default function Dashboard() {
	const { business } = useOutletContext<LayoutContextType>()

	return (
		<ScreenLayout>
			<h1 className="text-xl py-4">
			Dashboard : {business.name}
			</h1>

			<div className="flex flex-col md:grid md:grid-cols-2 w-full sm:w-5/6 gap-8">
				<PendingOrdersCard />
				<LowStockItemsCard />
			</div>
		</ScreenLayout>
	)
}
