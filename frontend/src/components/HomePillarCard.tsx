import React from 'react'
import {Link} from 'react-router-dom'
import { buttonVariants } from './styles/ButtonStyles'
import {cardVariants} from './styles/CardStyles'

interface HomePillarCardProps {
	title: string,
	description: string,
	route: string
}

export default function HomePillarCard( { title, description, route } : HomePillarCardProps ) {
	return (
		<div className={cardVariants.base}>
		<h2 className='text-lg font-mono font-bold'>{title}</h2>
		<p className='text-neutral-700'>{description}</p>
		<Link
			className={`${buttonVariants.base} w-fit mt-3 font-mono`}
			to={route}>
			[ Learn more → ]
			</Link>
		</div>
	)
}
