import React from 'react'
import { cardVariants } from '../components/CardStyles'

interface ModalLayoutProps {
	onClose: () => void
	children: React.ReactNode
}

export default function ModalLayout( { onClose, children }: ModalLayoutProps ){
	return (
		<div 
			onClick={onClose}
			className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 w-full">
			<div
				onClick={(e) => e.stopPropagation()}
				className={`${cardVariants.base} gap-4 p-4 w-full md:w-2/3 max-w-lg shadow-lg`}>
				{children}
			</div>
		</div>
	)
}
