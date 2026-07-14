import {useCallback, useEffect, useState} from "react"
import { createCustomer, getCustomers } from '../api/customers'
import type { Customer } from '../types'
import {customerCreateSchema} from "../schemas/customer"
import type { CustomerCreateData, CustomerErrors } from "../schemas/customer"
import {useToast} from "../context/ToastContext"
import {useValidation} from "./useValidation"

export const useCustomer = () => {
	const { showToast } = useToast()
	const { errors, validate, clearErrors } = useValidation<CustomerErrors>()
	const validateCustomer = useCallback((data: CustomerCreateData) => validate(customerCreateSchema, data), [validate])

	const [ customers, setCustomers ] = useState<Customer[]>([])
	const [ loading, setLoading ] = useState<boolean>(false)
	const [ submitting, setSubmitting] = useState<boolean>(false)
	const [ loadError, setLoadError ] = useState<string | null>(null)

	useEffect(() => {
		async function loadCustomers() {
			try {
				setLoading(true)
				const data = await getCustomers()
				setCustomers(data)
			} catch (err) {
				setLoadError(err instanceof Error ? err.message : "Unkown error")
			} finally {
				setLoading(false)
			}
		}
		loadCustomers()
	}, [])

	const handleCustomerCreate = useCallback( async (customerData: CustomerCreateData): Promise<string | null> => {
		setSubmitting(true)
		try {
			const newCustomer: Customer= await createCustomer(customerData)

			setCustomers((prevCustomers) => [...prevCustomers, newCustomer])
			showToast('Customer created succesfully', 'message')
			return newCustomer.id 
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unkown error"
			showToast(`Failed to create customer: ${message}`)
			return null 
		} finally {
			setSubmitting(false)
		}
	}, [])

	return {
		customers,
		validateCustomer,
		handleCustomerCreate,
		loading,
		submitting,
		errors,
		loadError,
		clearErrors
	}
}
