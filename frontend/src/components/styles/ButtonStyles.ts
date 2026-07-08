const SHARED_BASE = "p-2 px-3 text-md disabled:opacity-50 cursor-pointer ease-in duration-200 active:scale-90";

export const buttonVariants = {
	base: `${SHARED_BASE} rounded-sm hover:bg-neutral-700 hover:text-neutral-200`,
	
	primary: `${SHARED_BASE} rounded-xl bg-neutral-700 text-neutral-200 hover:bg-neutral-500 text-nowrap`,
	
	secondary: `${SHARED_BASE} rounded-sm hover:bg-neutral-700 hover:text-neutral-200 border border-dashed border-neutral-500 text-nowrap font-mono`,
	
	toggleOn: `${SHARED_BASE} rounded-lg bg-neutral-700 text-neutral-200 font-mono border border-neutral-400`,
	
	toggleOff: `${SHARED_BASE} rounded-lg bg-neutral-200 text-neutral-700 font-mono border border-neutral-400`,
	
	danger: "p-2 text-red-500 rounded-sm cursor-pointer hover:bg-red-500 hover:text-neutral-200 ease-in duration-200"
}
