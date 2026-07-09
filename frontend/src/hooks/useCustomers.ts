import {useCallback, useEffect, useState} from "react"
import { createCustomer, getCustomers } from '../api/customers'
import type { CreateCustomerPayload, Customer } from '../types'
import {customerCreateSchema, type CustomerErrors} from "../schemas/customer"
import {parseZodErrors} from "../utils/parseZodErrors"

export const useCustomer = () => {
	const [ customers, setCustomers ] = useState<Customer[]>([])
	const [ loading, setLoading ] = useState<boolean>(false)
	const [ submitting, setSubmitting] = useState<boolean>(false)
	const [ errors, setErrors ] = useState<CustomerErrors>({})
	const [ error, setError ] = useState<string | null>(null)

	useEffect(() => {
		async function loadCustomers() {
			try {
				setLoading(true)
				const data = await getCustomers()
				setCustomers(data)
			} catch (err) {
				setError(err instanceof Error ? err.message : "Unkown error")
			} finally {
				setLoading(false)
			}
		}
		loadCustomers()
	}, [])

	const handleCustomerCreate = useCallback( async (customerData: CreateCustomerPayload): Promise<string | null> => {
		const result = customerCreateSchema.safeParse(customerData)
		if (!result.success) {
			const newErrors = parseZodErrors<CustomerErrors>(result.error)
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
			setError(err instanceof Error ? err.message : "Unkown error")
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
