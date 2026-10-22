import {buttonVariants} from "../components/styles/ButtonStyles";
import {cardVariants} from "../components/styles/CardStyles";
import HomePillarCard from "../components/HomePillarCard";
import ScreenLayout from "../layouts/ScreenLayout";
import demo_ui from '../assets/demo_ui.png'
import demo_order_sync from '../assets/demo_order_sync.mp4'
import demo_order_sync_webm from '../assets/demo_order_sync.webm'
import demo_stock_sync from '../assets/demo_stock_sync.mp4'
import demo_stock_sync_webm from '../assets/demo_stock_sync.webm'
import {Link} from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Home() {
	const { t } = useTranslation()
	const pillars = [
		{
			"title": t("home.pillars.realTimeStock.title"),
			"description": t("home.pillars.realTimeStock.description"),
		},
		{
			"title": t("home.pillars.smartRestocking.title"),
			"description": t("home.pillars.smartRestocking.description"),
		},
		{
			"title": t("home.pillars.orderManagement.title"),
			"description": t("home.pillars.orderManagement.description"),
		},
	]
	return (
		<ScreenLayout>
			<div className="flex flex-col gap-5 items-center">
			{/* Introduction */}
			<div className="flex flex-col items-center p-5 gap-4">
				<h1 className="text-xl font-mono">{t("home.heroTitle")}</h1>
				<p className="text-lg text-neutral-700 dark:text-neutral-400">{t("home.heroDescription")}</p>

			<div
				className="w-2/3 shadow-lg shadow-zinc-600 rounded-xl overflow-hidden">
				<img
					src={demo_ui}
					alt={t("home.images.dashboardPreview")}/>
			</div>
			</div>

			{/* Pillars */}
			<div
				className={`grid grid-cols-1 md:grid-cols-${pillars.length} gap-3 md:w-2/3`}>

				{pillars.map(pillar => (
					<HomePillarCard
						key={pillar.title}
						title={pillar.title}
						description={pillar.description}
						/>
				))}
			</div>

			{/* Problem & Solution */}

			<div
				className={`${cardVariants.base} shadow-lg flex flex-col w-full md:w-2/3`}>
				<div
					className="flex flex-col md:odd:flex-row-reverse items-center gap-2 md:gap-8 p-4">
					<div className="w-full md:w-1/2">
					<h2 className="text-xl font-mono">
						{t("home.workflow.inventoryTitle")}
					</h2>
					<p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
					{t("home.workflow.inventoryDescription")}
					</p>
					</div>
					<video
						autoPlay
						loop
						muted
						playsInline
						width="60%"
						style={{ borderRadius: "8px" }}
						aria-label={t("home.images.stockSync")}>
						<source src={demo_stock_sync_webm} type="video/webm" />
						<source src={demo_stock_sync} type="video/mp4" />
						Your browser does not support HTML5 video.
						</video>
				</div>

				<div
					className="flex flex-col md:flex-row md:odd:flex-row-reverse items-center gap-2 md:gap-8 p-4">

					<div className="w-full md:w-1/2">
					<h2 className="text-xl font-mono">
						{t("home.workflow.orderSyncTitle")}
					</h2>
					<p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
					{t("home.workflow.orderSyncDescription")}
					</p>
					</div>
					<video
						autoPlay
						loop
						muted
						playsInline
						width="60%"
						style={{ borderRadius: "8px" }}
						aria-label={t("home.images.orderSync")}>
						<source src={demo_order_sync_webm} type="video/webm" />
						<source src={demo_order_sync} type="video/mp4" />
						Your browser does not support HTML5 video.
						</video>
				</div>
			</div>

			{/* CTA */}
			
			<div className={`flex flex-col gap-3 w-full md:w-2/3 items-center`}>
				<div className="flex flex-col border border-dashed border-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 gap-8">
					<div className="p-2 border-b border-neutral-800">
						<h1 className="text-2xl text-center font-bold">{t("home.pricing.title")}</h1>
					</div>
					<div className="flex flex-row font-mono gap-2 items-center justify-center">
						<p className="text-3xl">$19.99</p>
						<p className="font-mono text-sm className text-neutral-400">{t("home.pricing.month")}</p>
					</div>
					<div className="flex flex-col gap-2">
						<p>{t("home.pricing.features.orderManagement")}</p>
						<p>{t("home.pricing.features.stockManagement")}</p>
						<p>{t("home.pricing.features.productPricing")}</p>
						<p>{t("home.pricing.features.dashboard")}</p>
					</div>
					<div className="flex flex-col gap-2">
						<Link 
							to="/register"
							className={buttonVariants.primary}>
							{t("home.pricing.tryForFree")}
						</Link>
						<p className="text-neutral-500 text-sm">{t("home.pricing.freeTrial")}</p>
					</div>
				</div>
			</div>
			</div>
		</ScreenLayout>
	)
}
