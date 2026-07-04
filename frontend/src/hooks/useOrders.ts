import { useState, useEffect, useCallback } from "react"
import { getOrders, createOrder, updateOrder } from '../api/orders'
import type { OrderStatus, Order, CreateOrderPayload } from '../types'
import {formatDatetime} from "../utils/date"
import {orderCreateSchema, orderUpdateSchema, type OrderErrors} from "../schemas/order"
import {parseZodErrors} from "../utils/parseZodErrors"

export const useOrders = () => {
	const [ orders, setOrders ] = useState<Order[]>([])
	const [ submitting, setSubmitting ] = useState<boolean>(false)
	const [ loading, setLoading] = useState<boolean>(false)
	const [ searchQuery, setSearchQuery ] = useState<string>('')
	const [ filterStatus, setFilterStatus ] = useState<OrderStatus | ''>('')
	const [ errors, setErrors ] = useState<OrderErrors>({})
	const [ error, setError ] = useState<string | null>(null)

	useEffect(() => {
		async function loadOrders() {
			try {
				setLoading(true)
				const data = await getOrders()
				setOrders(data)
			} catch (err) {
				setError(err)
			} finally {
				setLoading(false)
			}
		}
		loadOrders()
	}, [])

	const handleOrderCreate = useCallback( async (orderData: CreateOrderPayload): Promise<boolean> => {
		const result = orderCreateSchema.safeParse(orderData)
		if (!result.success) {
			const newErrors = parseZodErrors<OrderErrors>(result.error)
			setErrors(newErrors)
			return false
		}
		setErrors({})		
		setSubmitting(true)
		setError(null)
		try {
			const newOrder: Order = await createOrder(orderData)

			setOrders((prevOrders) => [...prevOrders, newOrder])
			return true
		} catch (err) {
			setError(err)
			console.error("Failed to create order:", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])

	const handleOrderDelete = async(id: string) => {
		setSubmitting(true)
		setError(null)
		try {
			const updatedOrder: Order = await updateOrder(id, { status: 'cancelled' as OrderStatus })
			setOrders((prevOrders) => prevOrders.map((order) => order.id === id ? updatedOrder : order))
			return true
		} catch (err) {
			setError(err)
			console.error("Failed to update order:", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}

	const handleOrderUpdate = useCallback( async (id: string, orderData: Partial<CreateOrderPayload>): Promise<boolean> => {
		const result = orderUpdateSchema.safeParse(orderData)
		if (!result.success) {
			const newErrors = parseZodErrors<OrderErrors>(result.error)
			setErrors(newErrors)
			return false
		}
		setErrors({})		
		setSubmitting(true)
		setError(null)
		try {
			const updatedOrder: Order = await updateOrder(id, orderData)
			setOrders((prevOrders) => prevOrders.map((order) => order.id === id ? updatedOrder : order))
			return true
		} catch (err) {
			setError(err)
			console.error("Failed to update order:", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])



	const visibleOrders = orders.filter( order => {
		const matchesStatus = filterStatus ? order.status === filterStatus : true

		const matchesSearch = searchQuery
			? formatDatetime(order.created_at).includes(searchQuery.toLowerCase())
			: true
		return matchesSearch && matchesStatus
	})

	return {
		orders,
		visibleOrders,
		filterStatus,
		setFilterStatus,
		searchQuery,
		setSearchQuery,
		handleOrderCreate,
		handleOrderUpdate,
		handleOrderDelete,
		loading,
		submitting,
		errors,
		error
	}

}
