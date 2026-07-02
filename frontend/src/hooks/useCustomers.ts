import {useCallback, useEffect, useState} from "react"
import { createCustomer, getCustomers } from '../api/customers'
import type { CreateCustomerPayload, Customer } from '../types'
import {customerCreateSchema, type CustomerCreateData} from "../schemas/customer"

export const useCustomer = () => {
	const [ customers, setCustomers ] = useState<Customer[]>([])
	const [ loading, setLoading ] = useState<boolean>(false)
	const [ submitting, setSubmitting] = useState<boolean>(false)
	const [ errors, setErrors ] = useState<{ name?: string, phone?: string }>({})
	const [ error, setError ] = useState<string | null>(null)

	useEffect(() => {
		async function loadCustomers() {
			try {
				setLoading(true)
				const data = await getCustomers()
				setCustomers(data)
			} catch (err) {
				setError(err)
			} finally {
				setLoading(false)
			}
		}
		loadCustomers()
	}, [])

	const handleCustomerCreate = useCallback( async (customerData: CreateCustomerPayload): Promise<string | null> => {
		const result = customerCreateSchema.safeParse(customerData)
		if (!result.success) {
			const newErrors: typeof errors = {}
			for (const issue of result.error.issues) {
				const field = issue.path[0] as keyof typeof newErrors
				if (!newErrors[field]) newErrors[field] = issue.message
			}
			setErrors(newErrors)
			return null 
		}
		setErrors({})		
		setSubmitting(true)
		setError(null)
		try {
			const newCustomer: Customer= await createCustomer(customerData)

			setCustomers((prevCustomers) => [...prevCustomers, newCustomer])
			return newCustomer.id 
		} catch (err) {
			setError(err)
			console.error("Failed to create customer:", err)
			return null 
		} finally {
			setSubmitting(false)
		}
	}, [])

	return {
		customers,
		handleCustomerCreate,
		loading,
		submitting,
		errors,
		error
	}
}
