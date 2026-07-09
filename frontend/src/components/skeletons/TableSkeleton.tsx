import { cardVariants } from '../styles/CardStyles.ts'

export default function TableSkeleton({ rows = 4, cols = 4 }) {
	return (
		<div className={`${cardVariants.table} sm:mx-2 animate-pulse rounded-xl overflown-hidden`}>
			<div className="flex flex-col gap-3 order border-neutral-200">
				
				{/* Table Header Skeleton */}
				<div 
					className="grid gap-4 bg-neutral-200 h-14 p-4 items-center rounded-t-xl"
					style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
				>
					{Array.from({ length: cols }).map((_, cIdx) => (
						<div 
							key={cIdx} 
							className="h-4 bg-neutral-400 rounded"
							style={{ width: cIdx % 2 === 0 ? '60%' : '40%' }}
						/>
					))}
				</div>

				{/* Table Body Rows Skeleton */}
				{Array.from({ length: rows }).map((_, rIdx) => (
					<div 
						key={rIdx}
						className="grid gap-4 bg-neutral-50 h-12 px-4 items-center rounded-xl border border-neutral-200/60"
						style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
					>
						{Array.from({ length: cols }).map((_, cIdx) => (
							<div 
								key={cIdx} 
								className="h-3 bg-neutral-200 rounded"
								style={{ width: `${60 + (cIdx * 7) % 35}%` }} 
							/>
						))}
					</div>
				))}

				{/* Footer */}
				<div className="flex flex-row justify-center items-center gap-4 my-4 mb-2">
					<div className="w-20 h-6 rounded-xl bg-neutral-400/40"/>
					<div className="w-16 h-6 rounded-xl bg-neutral-300/40"/>
					<div className="w-20 h-6 rounded-xl bg-neutral-400/40"/>
				</div>
			</div>
		</div>
	)
}
