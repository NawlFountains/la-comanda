import {buttonVariants} from "../components/ButtonStyles";
import {cardVariants} from "../components/CardStyles";
import HomePillarCard from "../components/HomePillarCard";
import ScreenLayout from "../layouts/ScreenLayout";

export default function Home() {
	const pillars = [
		{
			"title": "Real-time stock",
			"description": "Automatically track current stock, updates on restocks and orders",
			"route": "/"
		},
		{
			"title": "Smart restocking",
			"description": "Never run out of stock again. Set low-stock threshold and generate purchase orders in 1 click.",
			"route": "/"
		},
		{
			"title": "Seamless order managment",
			"description": "Track customer orders form placement to fulfillment without losing your mind.",
			"route": "/"
		},
	]
	return (
		<ScreenLayout>
			{/* Introduction */}
			<div className="flex flex-col items-center p-5 gap-4">
				<h1 className="text-xl font-mono">Stop guessing your inventory. Focus on what matters</h1>
				<p className="text-lg text-neutral-700">Streamline your stock, automate restock alerts, manage customer
				orders all from one centralized dashbord.</p>

			<img
				alt="demo_ui">
			</img>
			</div>

			{/* Pillars */}
			<div
				className={`grid grid-cols-1 md:grid-cols-${pillars.length} gap-3 md:w-2/3`}>

				{pillars.map(pillar => (
					<HomePillarCard
						key={pillar.title}
						title={pillar.title}
						description={pillar.description}
						route={pillar.route}
						/>
				))}
			</div>

			{/* Problem & Solution */}

			<div
				className={`${cardVariants.base} flex flex-col w-full md:w-2/3`}>
				<div
					className="flex flex-col md:odd:flex-row-reverse items-center">
					<div className="w-full md:w-1/2">
					<h2 className="text-xl font-mono">
						Goodbye to spreadsheets
					</h2>
					<p className="text-neutral-600 leading-relaxed">
					Instead of spending time every time your buy products, simply log the restock and the stock is updated automatically.
					</p>
					</div>
					<img
						className="w-full md:w-1/2"
						alt="mock_advantange_img">
					</img>
				</div>

				<div
					className="flex flex-col md:flex-row md:odd:flex-row-reverse items-center">

					<div className="w-full md:w-1/2">
					<h2 className="text-xl font-mono">
						Order syncing
					</h2>
					<p className="text-neutral-600 leading-relaxed">
					Log every other you got either in-person, by your cook or by yourself, orders sync instanly so your inventory numbers are flawless across your system.
					</p>
					</div>
					<img
						className="w-full md:w-1/2"
						alt="mock_advantange_img">
					</img>
				</div>
			</div>

			{/* CTA */}

			<div className={`${cardVariants.dashed} gap-3 w-full md:w-2/3 items-center`}>
				<p>
					Ready to take control of your inventory? 
					Join now to stop wasting time on managment
				</p>
				<button
					className={`{${buttonVariants.base} font-mono p-2 w-full md:w-1/3`}>
					[ Create your free account ]
					</button>
			</div>

			{/* Footer */}


		</ScreenLayout>
	)
}
