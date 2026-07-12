import {cardVariants} from './styles/CardStyles'

interface HomePillarCardProps {
	title: string,
	description: string,
}

export default function HomePillarCard( { title, description } : HomePillarCardProps ) {
	return (
		<div className={`${cardVariants.base} shadow-lg`}>
		<h2 className='text-lg font-mono font-bold'>{title}</h2>
		<p className='text-neutral-700 dark:text-neutral-400'>{description}</p>
		</div>
	)
}
