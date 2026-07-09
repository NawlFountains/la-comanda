import { useState, useEffect, useCallback } from "react"
import { getOrders, createOrder, updateOrder } from '../api/orders'
import type { OrderStatus, Order, CreateOrderPayload } from '../types'
import {orderCreateSchema, orderUpdateSchema, type OrderErrors} from "../schemas/order"
import {parseZodErrors} from "../utils/parseZodErrors"

export const useOrders = () => {
	const [ orders, setOrders ] = useState<Order[]>([])
	const [ submitting, setSubmitting ] = useState<boolean>(false)
	const [ loading, setLoading] = useState<boolean>(false)
	const [ searchDate, setSearchDate ] = useState<string | null>(null)
	const [ appliedDate, setAppliedDate ] = useState<string | null>(null)
	const [ filterStatus, setFilterStatus ] = useState<OrderStatus | null>(null) 
	const [ errors, setErrors ] = useState<OrderErrors>({})
	const [ loadError, setLoadError ] = useState<string | null>(null)
	const [ submitError, setSubmitError ] = useState<string | null>(null)

	const [ page, setPage ] = useState<number>(1)
	const LIMIT = 20

	useEffect(() => {
		async function loadOrders() {
			try {
				setLoading(true)
				const offset = (page - 1) * LIMIT

				const data = await getOrders({limit: LIMIT,offset, status: filterStatus, orderDate: appliedDate})
				setOrders(data)
			} catch (err) {
				setLoadError(err)
			} finally {
				setLoading(false)
			}
		}
		loadOrders()
	}, [page, filterStatus, appliedDate])

	const handleStatusChange = (status: OrderStatus | null) => {
		setFilterStatus(status)
		setPage(1)
	}

	const handleDateChange = (dateString: string | null) => {
		setAppliedDate(dateString || null)
		setPage(1)
	}

	const handleOrderCreate = useCallback( async (orderData: CreateOrderPayload): Promise<boolean> => {
		const result = orderCreateSchema.safeParse(orderData)
		if (!result.success) {
			const newErrors = parseZodErrors<OrderErrors>(result.error)
			setErrors(newErrors)
			return false
		}
		setErrors({})		
		setSubmitting(true)
		setSubmitError(null)
		try {
			const newOrder: Order = await createOrder(orderData)

			setOrders((prevOrders) => [...prevOrders, newOrder])
			return true
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unknown error")
			console.error("Failed to create order:", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])

	const handleOrderDelete = async(id: string) => {
		setSubmitting(true)
		setSubmitError(null)
		try {
			const updatedOrder: Order = await updateOrder(id, { status: 'cancelled' as OrderStatus })
			setOrders((prevOrders) => prevOrders.map((order) => order.id === id ? updatedOrder : order))
			return true
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unkown error")
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
		setSubmitError(null)
		try {
			const updatedOrder: Order = await updateOrder(id, orderData)
			setOrders((prevOrders) => prevOrders.map((order) => order.id === id ? updatedOrder : order))
			return true
		} catch (err) {
			setSubmitError(err instanceof Error ? err.message : "Unkown error")
			console.error("Failed to update order:", err)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])

	return {
		orders,
		page,
		setPage,
		limit: LIMIT,
		filterStatus,
		setFilterStatus: handleStatusChange,
		searchDate,
		setSearchDate,
		setAppliedDate: handleDateChange,
		handleOrderCreate,
		handleOrderUpdate,
		handleOrderDelete,
		loading,
		submitting,
		errors,
		loadError,
		submitError
	}

}
