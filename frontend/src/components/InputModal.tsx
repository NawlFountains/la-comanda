import React from "react"

interface InputModalProps extends React.InputHTMLAttributes<HTMLInputElement> {
}

export default function InputModal( { className= "", ...props } : InputModalProps) {
	return (
		<input 
			className={`h-8 px-3 border border-neutral-500 rounded-lg bg-neutral-250 ${className}`}
			{...props}>
		</input>
	)
}
