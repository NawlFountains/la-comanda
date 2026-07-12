import React from 'react'
import Footer from '../components/Footer'

export default function ScreenLayout( { children } : { children : React.ReactNode }) {
	return (
		<div className='min-h-screen w-full dark:bg-zinc-900 dark:text-neutral-200 bg-neutral-200 flex flex-col items-center w-5/6'>
			<div className='w-full flex flex-col sm:w-5/6 items-center py-2'>
			{children}
			</div>
			<Footer />
		</div>
	)
}
