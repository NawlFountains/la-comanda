import React from 'react'
import { TrashIcon } from './styles/Icons'

interface InputSearchFilterProps {
	id: string
	type?: React.HTMLInputTypeAttribute
	value: string | null
	onChange: (value: string | null) => void
	onApply: (value: string | null) => void
	placeholder?: string
	className?: string
}

export default function InputSearchFilter({
	id,
	type = "text",
	value,
	onChange,
	onApply,
	placeholder,
	className = "",
}: InputSearchFilterProps) {
	return (
		<div className={`flex flex-row w-full ${className} min-h-10`}>
			<input
				value={value ?? ""}
				type={type}
				id={id}
				placeholder={placeholder}
				onChange={(e) => onChange(e.target.value || null)}
				onKeyDown={(e) => {
					if (e.key === "Enter") onApply(value)
				}}
				className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-l-lg px-3 w-full focus:outline-none focus:ring-1 focus:ring-neutral-500"
			/>
			<button
				onClick={() => onApply(value)}
				className="bg-neutral-800 dark:bg-neutral-700 text-neutral-200 px-4 rounded-r-lg hover:bg-neutral-700 dark:hover:bg-neutral-200 dark:hover:text-neutral-800 transition-colors whitespace-nowrap"
			>
				Search
			</button>
			{value && (
				<button
					onClick={() => {
						onChange(null)
						onApply(null)
					}}
					className="ml-2 text-neutral-400 hover:text-red-500 transition-colors"
				>
					<TrashIcon />
				</button>
			)}
		</div>
	)
}

