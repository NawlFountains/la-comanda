import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

interface Toast {
	id: string
	message: string
	type: "error" | "message"
}
interface ToastContextValue {
	showToast: (message: string, type?: Toast['type']) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export default function ToastProvider({ children }: { children: ReactNode }) {
	const [toasts, setToasts] = useState<Toast[]>([])

	const showToast = useCallback((message: string, type: Toast['type'] = 'error') => {
		const id = crypto.randomUUID()
		setToasts((prev) => [...prev, {id, message, type}])
		setTimeout(() => {
			setToasts((prev) => prev.filter((t) => t.id !== id))
		}, 4000)
	}, [])

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<div className='fixed bottom-4 right-4 flex flex-col gap-2 z-50'>
				{toasts.map((t) => (
					<div 
						key={t.id} 
						className={`text-neutral-200 p-3 rounded
							${t.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
						{t.message}
					</div>
				))}
			</div>
		</ToastContext.Provider>
	)
}

export function useToast() {
	const ctx = useContext(ToastContext)
	if (!ctx) throw new Error("useToast must be used within ToastProvider")
	return ctx
}
