import React from 'react'
import { useTranslation } from 'react-i18next'
import { buttonVariants } from './styles/ButtonStyles'

interface PaginationControlFooterProps {
	loading: boolean
	page: number
	setPage: React.Dispatch<React.SetStateAction<number>>
	limit: number
	itemCount: number
}

export default function PaginationControlFooter({ loading, page, setPage, limit, itemCount }: PaginationControlFooterProps) {
	const { t } = useTranslation()
	return (
		<div className="flex flex-row justify-center items-center gap-4 mt-4 mb-2">
			<button
			disabled={page === 1 || loading}
			onClick={() => setPage(prev => Math.max(prev - 1, 1))}
			className={`${buttonVariants.secondary} px-4 py-1 disabled:opacity-50 disabled:cursor-not-allowed`}
			>
				{t("pagination.previous")}
			</button>
			<span className="font-mono text-sm">{t("pagination.page")} {page}</span>
			<button
				disabled={itemCount < limit || loading} 
				onClick={() => setPage(prev => prev + 1)}
				className={`${buttonVariants.secondary} px-4 py-1 disabled:opacity-50 disabled:cursor-not-allowed`}
			>
				{t("pagination.next")}
			</button>
		</div>
	)
}
