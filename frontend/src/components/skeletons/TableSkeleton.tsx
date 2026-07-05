import React from 'react'
import { cardVariants } from '../styles/CardStyles.ts'

export default function TableSkeleton({ rows = 4, cols = 4 }) {
	return (
		<div className={`w-full ${cardVariants.table} p-2 animate-pulse`}>
			<div className="flex flex-col gap-3 bg-neutral-100 rounded-xl border border-neutral-200">
				
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
			</div>
		</div>
	)
}
