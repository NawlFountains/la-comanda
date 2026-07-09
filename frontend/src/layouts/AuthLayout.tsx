import React from 'react'
import Footer from '../components/Footer'

export default function AuthLayout({ children }: { children: React.ReactNode } ) {
	return (
		<div className="min-h-screen w-full bg-neutral-100 sm:bg-neutral-200 flex flex-col items-center justify-center">
		    {children}
		    <Footer />
		</div>
	)
}
