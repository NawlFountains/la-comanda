export const formatDatetime = (date: Date | string): string => {
	return 	new Date(date).toLocaleString()
}

export const formatDate = (date: Date | string): string => {
	return 	new Date(date).toLocaleDateString()
}
