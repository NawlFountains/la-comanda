const SHARED_BASE = "flex flex-col bg-neutral-200 dark:bg-neutral-800 border rounded-lg"

export const cardVariants = {
	base: `${SHARED_BASE} border-neutral-300 dark:border-neutral-800 justify-between p-3 overflown-hidden`,
	tableBody: `${SHARED_BASE} border-neutral-300 dark:border-neutral-600 text-center shadow-lg`,
	dashed: `${SHARED_BASE} border-dashed border-neutral-400 dark:border-neutral-600 justify-between p-3`,
	danger: `${SHARED_BASE} border border-red-400 justify-between p-2`
}
