const getLocale = (): string => navigator.language || 'en-US'

export const formatDatetime = (date: Date | string): string => {
	return 	new Date(date).toLocaleString(getLocale())
}

export const formatDate = (date: Date | string): string => {
	return 	new Date(date).toLocaleDateString(getLocale())
}
