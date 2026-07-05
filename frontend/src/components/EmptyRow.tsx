import React from "react"

interface EmptyRowProps {
	message: string
}

export default function EmptyRow ({ message }: EmptyRowProps ) {
	return (
		<div
			className="p-2">
			<p className="font-mono text-md">{message}</p>
		</div>
	)
}
