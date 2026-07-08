import React from 'react'
import { Link } from 'react-router-dom'
import ScreenLayout from '../../layouts/ScreenLayout'
import errorImage from '../../assets/loading-cat.jpg'
import { buttonVariants } from '../styles/ButtonStyles'


interface ErrorLoadingProps {
	message: string
}

export default function ErrorLoading({ message }: ErrorLoadingProps) {
	console.error('Error: ',message)

	return (
	<ScreenLayout>
		<div className='my-auto flex flex-col text-center items-center gap-5 py-4'>
			<img
				alt="cat-error"
				src={errorImage}>
				</img>
			<p
				className='text-red-500 text-lg'>
				This is embarassing, failed to fetch data
			</p>
			<p className='text-base font-mono'>
				Refresh the page and try again
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
