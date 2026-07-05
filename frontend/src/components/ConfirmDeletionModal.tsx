import React from "react"
import { cardVariants } from "./styles/CardStyles"
import {buttonVariants} from "./styles/ButtonStyles"

interface ConfirmDeletionModalProps {
	name: string,
	onClose: () => void,
	onConfirm: () => void
	submitting: boolean
}

export default function ConfirmDeletionModal( { name, onClose, onConfirm, submitting }: ConfirmDeletionModalProps) {
	return (
		<div 
			onClick={onClose}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">

			<div
				onClick={(e) => e.stopPropagation()}
				className={`${cardVariants.base} gap-4 p-4 w-full md:w-fit shadow-lg`}>
				<p> Are you sure you want to delete {name} ?</p>
				<div className="flex flex-row justify-between">
					<button 
						onClick={onClose}
						className={buttonVariants.base}>
						Cancel
					</button>
					<button 
						onClick={onConfirm}
						disabled={submitting}
						className={buttonVariants.danger}>
						{submitting ? 'Deleting...' : 'Delete'}
					</button>
				</div>
			</div>
		</div>
	)
}
