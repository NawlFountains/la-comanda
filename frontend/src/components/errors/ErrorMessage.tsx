interface ErrorMessageProps {
	message: string
}

export default function ErrorMessage( { message }: ErrorMessageProps) {
	return (
		<div className='text-red-500 p-1'>
			{message}
		</div>
	)
}
