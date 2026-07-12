import {buttonVariants} from "../components/styles/ButtonStyles";
import {cardVariants} from "../components/styles/CardStyles";
import HomePillarCard from "../components/HomePillarCard";
import ScreenLayout from "../layouts/ScreenLayout";
import demo_ui from '../assets/demo_ui.png'
import {Link} from "react-router-dom";

export default function Home() {
	const pillars = [
		{
			"title": "Real-time stock",
			"description": "Automatically track current stock, updates on restocks and orders",
		},
		{
			"title": "Smart restocking",
			"description": "Never run out of stock again. Set low-stock threshold and generate purchase orders in 1 click.",
		},
		{
			"title": "Seamless order managment",
			"description": "Track customer orders form placement to fulfillment without losing your mind.",
		},
	]
	return (
		<ScreenLayout>
			<div className="flex flex-col gap-5 items-center">
			{/* Introduction */}
			<div className="flex flex-col items-center p-5 gap-4">
				<h1 className="text-xl font-mono">Stop guessing your inventory. Focus on what matters</h1>
				<p className="text-lg text-neutral-700 dark:text-neutral-400">Streamline your stock, automate restock alerts, manage customer
				orders all from one centralized dashboard.</p>

			<div
				className="w-2/3 shadow-lg shadow-zinc-600 rounded-xl overflow-hidden">
				<img
					src={demo_ui}
					alt="demo_ui"/>
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
					className="flex flex-col md:odd:flex-row-reverse items-center">
					<div className="w-full md:w-1/2">
					<h2 className="text-xl font-mono">
						Goodbye to spreadsheets
					</h2>
					<p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
					Instead of spending time every time your buy products, simply log the restock and the stock is updated automatically.
					</p>
					</div>
					<img
						className="w-full md:w-1/2"
						alt="mock_advantange_img"/>
				</div>

				<div
					className="flex flex-col md:flex-row md:odd:flex-row-reverse items-center">

					<div className="w-full md:w-1/2">
					<h2 className="text-xl font-mono">
						Order syncing
					</h2>
					<p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
					Log every order you got either in-person, by your cook or by yourself, orders sync instanly so your inventory numbers are flawless across your system.
					</p>
					</div>
					<img
						className="w-full md:w-1/2"
						alt="mock_advantange_img"/>
				</div>
			</div>

			{/* CTA */}

			<div className={`${cardVariants.dashed} gap-3 w-full md:w-2/3 items-center`}>
				<p>
					Ready to take control of your inventory? 
					Join now to stop wasting time on managment
				</p>
				<Link
					to="/register"
					className={`{${buttonVariants.base} font-mono p-2 w-full md:w-1/3 text-center`}>
					[ Create your free account ]
					</Link>
			</div>
			<div className={`flex flex-col gap-3 w-full md:w-2/3 items-center`}>
				<div className="flex flex-col border border-dashed border-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded-xl p-3 gap-8">
					<div className="p-2 border-b border-neutral-800">
						<h1 className="text-2xl text-center font-bold">Pricing</h1>
					</div>
					<div className="flex flex-row font-mono gap-2 items-center justify-center">
						<p className="text-3xl">$19.99</p>
						<p className="font-mono text-sm className text-neutral-400">/ Month</p>
					</div>
					<div className="flex flex-col gap-2">
						<p>Control your orders for customers</p>
						<p>Stock mananagment</p>
						<p>Product pricing</p>
						<p>General dashboard</p>
					</div>
					<div className="flex flex-col gap-2">
					<button className={buttonVariants.primary}>Try for free</button>
						<p className="text-neutral-500 text-sm">* 7 days free trial</p>
					</div>
				</div>
			</div>
			</div>
		</ScreenLayout>
	)
}
