import {supabase} from '../supabase/supabaseClient'
import type { CreateCustomerPayload, Customer } from '../types'

const API_URL = import.meta.env.VITE_API_URL

export async function createCustomer(customerData: CreateCustomerPayload): Promise<Customer> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/customers`, {
		method: "POST",
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-type': 'application/json'
		},
		body: JSON.stringify(customerData)
	})

	if (!response.ok) throw new Error('Error when creating customer')
	return response.json()
}

export async function getCustomers(): Promise<Customer []> {
	const { data, error } = await supabase.auth.getSession()
	const token = data.session?.access_token

	if (!token) {
		throw new Error('User is not authenticated')
	}
	const response = await fetch(`${API_URL}/customers`, {
		headers: {
			'Authorization': `Bearer ${token}`
		}
	})

	if (!response.ok) throw new Error('Customers not found')
	return response.json()
}

