import React from 'react'

export default function ( { children } : { children : React.ReactNode }) {
	return (
	<div className='min-h-screen bg-neutral-200 flex flex-col items-center py-4'>
	{children}
	</div>
	)
}
