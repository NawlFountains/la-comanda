import {cardVariants} from '../styles/CardStyles'

export default function CardSkeleton({ rows = 3 }) {
	return (
		<div className={`${cardVariants.tableBody} animate-pulse w-full gap-3 pt-2 overflow-hidden rounded-lg`}>
			<div className='mx-auto w-2/3 h-8 bg-neutral-400 dark:bg-neutral-700/60 rounded-lg'/>
			<div className="flex flex-col">
				<div className="bg-neutral-200 dark:bg-neutral-900 grid grid-cols-3 h-14 items-center p-3 gap-3">
						<p className="h-6 bg-neutral-400 dark:bg-neutral-700/60 rounded"/>
						<p className="h-6 bg-neutral-400 dark:bg-neutral-700/60 rounded"/>
						<p className="h-6 bg-neutral-400 dark:bg-neutral-700/60 rounded"/>
				</div>
				{Array.from({ length: rows }).map((_, idx)=> (
					<div 
						key={idx} 
						className="grid grid-cols-3 gap-4 bg-neutral-50 dark:bg-neutral-800 h-12 px-4 items-center border border-neutral-200/60 dark:border-neutral-600">
						<div className="h-3 bg-neutral-200 dark:bg-neutral-700/40 rounded"/>
						<div className="h-3 bg-neutral-200 dark:bg-neutral-700/40 rounded"/>
						<div className="h-3 bg-neutral-200 dark:bg-neutral-700/40 rounded"/>
					</div>
				))}
			</div>
		</div>
	)
}
