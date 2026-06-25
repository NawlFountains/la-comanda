import React from 'react'

export default function ( { children } : { children : React.ReactNode }) {
	return (
	<div className='h-screen w-screen bg-neutral-200 flex flex-col items-center'>
	{children}
	</div>
	)
}
