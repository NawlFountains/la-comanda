import React from "react"

interface InputModalProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string
}

export default function InputModal({ className = "", label, id, ...props }: InputModalProps) {
	const input = (
		<input
			id={id}
			className={`h-8 w-full px-3 bg-neutral-250 outline-none border-none ${className}`}
			{...props}
		/>
	)

	if (!label) {
		return (
			<input
				id={id}
				className={`h-8 px-3 border border-neutral-400 rounded-lg bg-neutral-250 ${className}`}
				{...props}
			/>
		)
	}

	return (
		<fieldset className="border border-neutral-400 rounded-lg px-2 pb-1">
			<legend className="text-xs px-1 text-neutral-600">{label}</legend>
			{input}
		</fieldset>
	)
}
