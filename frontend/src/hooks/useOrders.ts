import { useState, useEffect, useCallback } from "react"
import { getOrders, createOrder, updateOrder } from '../api/orders'
import type { OrderStatus, Order } from '../types'
import {orderCreateSchema, orderUpdateSchema } from "../schemas/order"
import type { OrderCreateData, OrderErrors, OrderUpdateData } from '../schemas/order'
import {useToast} from "../context/ToastContext"
import {useValidation} from "./useValidation"

export const useOrders = () => {
	const { showToast } = useToast()
	const { errors, validate, clearErrors } = useValidation<OrderErrors>()

	const validateOrder = useCallback((data: OrderCreateData ) => validate(orderCreateSchema, data), [validate])
	const validateOrderUpdate = useCallback((data: OrderUpdateData) => validate(orderUpdateSchema, data), [validate])

	const [ orders, setOrders ] = useState<Order[]>([])
	const [ submitting, setSubmitting ] = useState<boolean>(false)
	const [ loading, setLoading] = useState<boolean>(false)
	const [ searchDate, setSearchDate ] = useState<string | null>(null)
	const [ appliedDate, setAppliedDate ] = useState<string | null>(null)
	const [ filterStatus, setFilterStatus ] = useState<OrderStatus | null>(null) 
	const [ loadError, setLoadError ] = useState<string | null>(null)

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
				setLoadError(err instanceof Error ? err.message : "Unkown error")
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

	const handleOrderCreate = useCallback( async (orderData: OrderCreateData): Promise<boolean> => {
		setSubmitting(true)
		let tempId = crypto.randomUUID()
		let optimisticOrder: Order = {
			...orderData,
			id: tempId,
			business_id: tempId ,
			created_at: new Date().toISOString().split('T')[0],
			order_items: orderData.order_items.map((item) => ({
				...item,
				id: tempId,
				order_id: tempId,
				unit_price: '-1'
			}))
		}
		setOrders((prev) => [...prev, optimisticOrder])
		try {
			const newOrder: Order = await createOrder(orderData)

			setOrders((prev) => prev.map((o) => (o.id === tempId ? newOrder: o )))
			showToast(`Order succesfully created`, 'message')
			return true
		} catch (err) {
			setOrders((prev) => prev.filter((o) => (o.id !== tempId)))
			const message = err instanceof Error ? err.message : "Unkown error"
			showToast(`Failed to create order: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [])

	const handleOrderDelete = async(id: string) => {
		setSubmitting(true)
		try {
			const updatedOrder: Order = await updateOrder(id, { status: 'cancelled' as OrderStatus })
			setOrders((prevOrders) => prevOrders.map((order) => order.id === id ? updatedOrder : order))
			showToast(`Order succesfully deleted`, 'message')
			return true
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unkown error"
			showToast(`Failed to delete order: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}
	}

	const handleOrderUpdate = useCallback( async (id: string, orderData: OrderUpdateData): Promise<boolean> => {
		setSubmitting(true)
		let previousOrder: Order | undefined
		setOrders((prev) => {
			previousOrder = prev.find((o) => o.id === id)
			return prev.map((o) =>
				o.id === id ? { ...o, ...orderData} : o
			)
		})
		try {
			const updatedOrder: Order = await updateOrder(id, orderData)
			setOrders((prev) => prev.map((o) => (o.id === id ? updatedOrder : o)))
			showToast(`Order succesfully updated`, 'message')
			return true
		} catch (err) {
			if (previousOrder) {
				setOrders((prev) => prev.map((o) => (o.id === id ? previousOrder! : o)))
			}
			const message = err instanceof Error ? err.message : "Unkown error"
			showToast(`Failed to update order: ${message}`)
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
		validateOrder,
		validateOrderUpdate,
		handleOrderCreate,
		handleOrderUpdate,
		handleOrderDelete,
		loading,
		submitting,
		errors,
		loadError,
		clearErrors
	}

}
