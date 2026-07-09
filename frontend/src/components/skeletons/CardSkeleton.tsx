import {cardVariants} from '../styles/CardStyles'

export default function CardSkeleton({ rows = 3 }) {
	return (
		<div className={`${cardVariants.table} animate-pulse w-full gap-3 pt-2`}>
			<div className='mx-auto w-2/3 h-8 bg-neutral-400 rounded'/>
			<div className="flex flex-col overflow-hidden">
				<div className="bg-neutral-200 grid grid-cols-3 h-14 items-center p-3 gap-3">
						<p className="h-6 bg-neutral-400 rounded"/>
						<p className="h-6 bg-neutral-400 rounded"/>
						<p className="h-6 bg-neutral-400 rounded"/>
				</div>
				{Array.from({ length: rows }).map((_, idx)=> (
					<div 
						key={idx} 
						className="grid grid-cols-3 gap-4 bg-neutral-50 h-12 px-4 items-center border border-neutral-200/60">
						<div className="h-3 bg-neutral-200 rounded"/>
						<div className="h-3 bg-neutral-200 rounded"/>
						<div className="h-3 bg-neutral-200 rounded"/>
					</div>
				))}
			</div>
		</div>
	)
}
