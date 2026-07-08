import React from 'react'
import Footer from '../components/Footer'

export default function ( { children } : { children : React.ReactNode }) {
	return (
		<div className='min-h-screen w-full bg-neutral-200 flex flex-col items-center w-5/6'>
			<div className='w-full flex flex-col sm:w-5/6 items-center py-2'>
			{children}
			</div>
			<Footer />
		</div>
	)
}
