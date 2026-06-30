import React from 'react'
import { useRouteError, isRouteErrorResponse, Link } from 'react-router-dom'
import ScreenLayout from '../layouts/ScreenLayout'
import errorImage from '../assets/loading-cat.jpg'
import { buttonVariants } from './ButtonStyles'

export default function ErrorFallback() {
	const error = useRouteError()
	console.error("Caught by Error Boundary:", error)

	let errorMessage = "An unexpected error occurred."

	if (isRouteErrorResponse(error)) {
		errorMessage = `${error.status} ${error.statusText}`
	} else if (error instanceof Error) {
		errorMessage = error.message
	}

	return (
		<ScreenLayout>
		<div className='my-auto flex flex-col text-center items-center gap-5'>
		<img
			alt="cat-error"
			src={errorImage}>
			</img>
		<p
			className='text-red-500 text-xl'>
		Error: {errorMessage}
		</p>
		<div className='grid grid-cols-1 md:grid-cols-2 content-evenly w-full md:w-2/3 gap-3'>
			<button
				className={`${buttonVariants.base}`}
				onClick={() => window.location.reload()}>
				Refresh
			</button>
			<Link 
				className={`${buttonVariants.base} border`}
				to="/">
				Go to home screen
			</Link>
		</div>
		</div>
		</ScreenLayout>
	)
}
