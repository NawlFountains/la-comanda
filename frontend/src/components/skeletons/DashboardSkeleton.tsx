import CardSkeleton from '../skeletons/CardSkeleton'
import { buttonVariants } from '../styles/ButtonStyles'

export default function DashboardSkeleton() {
	return (
		<div className="flex flex-col w-full sm:w-5/6 items-center gap-4 animate-pulse py-3">

			{/* Quick actions */}

			<div className="flex flex-col md:grid md:grid-cols-3 w-full md:w-2/3 max-w-xl gap-4 mb-4">
				<div className={`w-full h-10 rounded-xl ${buttonVariants.secondary} p-2`}>
					<div
						className='w-5/6 h-6 mx-auto rounded-xl bg-neutral-400 dark:bg-neutral-700'>
					</div>
				</div>
				<div className={`w-full h-10 rounded-xl ${buttonVariants.secondary} p-2`}>
					<div
						className='w-5/6 h-6 mx-auto rounded-xl bg-neutral-400 dark:bg-neutral-700'>
					</div>
				</div>
				<div className={`w-full h-10 rounded-xl ${buttonVariants.secondary} p-2`}>
					<div
						className='w-5/6 h-6 mx-auto rounded-xl bg-neutral-400 dark:bg-neutral-700'>
					</div>
				</div>

			</div>

			{/* General status */}

			<div className="flex flex-col md:grid md:grid-cols-2 gap-4 w-full">
				<CardSkeleton /> 
				<CardSkeleton /> 
			</div>
			<CardSkeleton /> 
		</div>
	)
}
