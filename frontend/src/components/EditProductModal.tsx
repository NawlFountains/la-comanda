import React, { useState, useMemo } from 'react'
import ModalLayout from '../layouts/ModalLayout'
import InputModal from '../components/InputModal.tsx'
import ErrorMessage from "./ErrorMessage.tsx"
import { buttonVariants } from '../components/ButtonStyles.ts'
import type { Product, CreateProductPayload, CreatePriceHistoryPayload, CreateRecipeItemPayload, PriceHistory, RecipeItem, Item } from '../types'
import type { ProductErrors } from '../schemas/product'
import {LoadingSpinner, PenIcon, TrashIcon} from './Icons.tsx'
import type {PriceHistoryErrors} from '../schemas/price_history.ts'
import type {RecipeItemErrors} from '../schemas/recipe_item.ts'

interface EditProductModalProps {
	onClose: () => void
	onEdit: (id: string, data: Partial<CreateProductPayload>) => Promise<boolean>
	onAddPrice: (productId: string, data: CreatePriceHistoryPayload) => Promise<boolean>
	onAddRecipeItem: (productId: string, data: CreateRecipeItemPayload) => Promise<boolean>
	onEditRecipeItem: (id: string, data: Partial<CreateRecipeItemPayload>) => Promise<boolean>
	onDeleteRecipeItem: (productId: string, id: string) => void
	product: Product
	prices: PriceHistory[]
	recipeItems: RecipeItem[]
	items: Item[]
	submitting: boolean
	loading: boolean
	errors: ProductErrors
	priceErrors: PriceHistoryErrors
	recipeErrors: RecipeItemErrors
}

export default function EditProductModal({
	onClose,
	onEdit,
	onAddPrice, 
	onAddRecipeItem, 
	onEditRecipeItem, 
	onDeleteRecipeItem, 
	product, 
	prices,
	recipeItems,
	items,
	submitting, 
	loading,
	errors,
	priceErrors,
	recipeErrors
}: EditProductModalProps) {
	const [name, setName] = useState(product?.name || '')
	const [showPastPrices, setShowPastPrices] = useState(false)

	const [createPrice, setCreatePrice] = useState(false)
	const [price, setPrice] = useState<string>('')
	const [validFrom, setValidFrom] = useState<string>( () => {
		return new Date().toISOString().split('T')[0]
	})

	const [newRecipeItems, setNewRecipeItems] = useState<CreateRecipeItemPayload[]>([])

	const [editingRecipeId, setEditingRecipeId] = useState<string | null>(null)

	const itemById = useMemo(() => {
		return Object.fromEntries(items.map(item => [item.id, item]))
	}, [items])

	const handleSubmit = async () => {
		if (createPrice) { 
			const successPrice = await onAddPrice(product.id, {
				price,
				valid_from: validFrom
			})
			if (!successPrice) return
		}
		if (newRecipeItems && newRecipeItems.length > 0) {
			try {
				const recipePromises = newRecipeItems.map((recipeItem) =>
					onAddRecipeItem(product.id, {
						item_id: recipeItem.item_id,
						quantity: recipeItem.quantity,
						unit: recipeItem.unit
					})
				)

				const recipeResults = await Promise.all(recipePromises)

				const allRecipeSaved = recipeResults.every(res => res === true)
				if (!allRecipeSaved) {
					console.warn("Some recipe items failed to save.")
					return
				}
			} catch (err) {
				console.log("Recipe items update encountered an error:", err)
				return
			}
		}

		const success = await onEdit(product.id, { name })
		if (success) onClose()
	}

	const handleAddRecipeItem = () => {
		const newRecipeItem: CreateRecipeItemPayload = {
			item_id: items[0]?.id || '',
			quantity: '1',
			unit: items[0]?.unit
		}

		setNewRecipeItems([...newRecipeItems, newRecipeItem])
	}

	const handleItemChange = (index: number, field: keyof CreateRecipeItemPayload, value: string ) => {
		const updatedRecipeItems = [...newRecipeItems]
		updatedRecipeItems[index] = {
			...updatedRecipeItems[index],
			[field]: value
		} as CreateRecipeItemPayload
		setNewRecipeItems(updatedRecipeItems)
	}

	const handleRemoveItem = (index: number) => {
		setNewRecipeItems(newRecipeItems.filter((_, i) => i !== index))
	}

	return (
		<ModalLayout onClose={onClose}> <div className='flex flex-col'>
				<h1 className='font-mono text-center'>Edit product</h1>
			</div>
			<div className='flex flex-col'>
				<InputModal 
					placeholder='name'
					value={name}
					onChange={(e) => setName(e.target.value)}/>
				{errors.name && (<ErrorMessage message={errors.name}/>)}
			</div>

			{/* Price History*/}
			{ loading ? (
				<LoadingSpinner />
			) : (
				<>
				<div className='flex flex-col text-center gap-3'>
					{/* Current price */}

					{/* Past prices */}
					{prices && prices.length > 0 && (
						<table>
						<thead>
							<tr className='text-lg font-mono bg-neutral-200'>
							<td>Price</td>
							<td>From</td>
							</tr>
						</thead>
						<tbody>
						{(showPastPrices ? prices : prices.slice(0, 1)).map(( price, idx) => (
							<tr key={idx}>
								<td className='w-1/2 p-2'>${price.price}</td>
								<td className='w-1/2'>{price.valid_from}</td>
							</tr>
						))}
						{createPrice && (
							<tr>
								<td className='flex flex-row items-center gap-2 px-4'>
								<p className=''>
								$
								</p>
								<InputModal
									className='w-full'
									value={price}
									placeholder="price"
									type='number'
									onChange={(e) => setPrice(e.target.value)}
									/>

								</td>
								<td className='px-4'>
								<InputModal
									className='w-full'
									value={validFrom}
									placeholder="valid from (YYYY-MM-DD)"
									onChange={(e) => setValidFrom(e.target.value)}
									/>
								</td>
								<td>
								<button
									onClick={() => setCreatePrice(false)}
								      className="p-2 text-gray-400 hover:text-red-500 text-sm"
								      title="Close create price">
								✕

								</button>
								</td>
							</tr>
						)}

						{priceErrors && (
							<tr>
								<td>
								{priceErrors.price && (<ErrorMessage message={priceErrors.price}/>)}
								</td>
								<td>
								{priceErrors.valid_from && (<ErrorMessage message={priceErrors.valid_from}/>)}
								</td>
							</tr>
						)}
						</tbody>
						</table>
					)}

					{prices && prices.length > 1 && (
						<button 
							onClick={() => setShowPastPrices(!showPastPrices)}
							className="text-sm text-neutral-600 underline cursor-pointer hover:text-neutral-800"
						>
							{showPastPrices? "Hide History" : `Show History (${prices.length - 1} more)`}
						</button>
					)}

					{!createPrice && (
						<button
							onClick={() => setCreatePrice(true)}
							className={`${buttonVariants.secondary}`}>
							Add Price
						</button>
					)}
				</div>

				{/* Recipe items */}
				<div className='flex flex-col text-center gap-3'>
					{(recipeItems && recipeItems.length > 0) || (newRecipeItems && newRecipeItems.length > 0) ? (
						<table>
						<thead>
							<tr className='text-lg font-mono bg-neutral-200'>
							<td>Item</td>
							<td>Amount</td>
							<td>Actions</td>
							</tr>
						</thead>
						<tbody>
						{recipeItems?.map(( item, idx) => {
							const isEditing = item.id === editingRecipeId
							const selectedItem = items.find(i => i.id === item.item_id)

							return (
								<tr key={item.id || idx}>
									{isEditing ? (
										<>
									{/* EDIT MODE: Dropdown selection */}
									<td>
										<select
											className='w-2/3 border border-neutral-700 rounded-lg py-1 px-2 text-center'
											value={item.item_id}
											onChange={(e) => onEditRecipeItem(item.id, { item_id: e.target.value })}
										>
											{items.map((validItem) => (
												<option key={validItem.id} value={validItem.id}>
													{validItem.name}
												</option>
											))}
										</select>
									</td>
									
									{/* EDIT MODE: Quantity Input */}
									<td className='flex flex-row gap-2 justify-center py-1'>
										<InputModal
											className='w-1/3'
											placeholder='Quantity'
											type='number'
											value={item.quantity || ''}
											step="any"
											onChange={(e) => onEditRecipeItem(item.id, { quantity: e.target.value })}
										/>
										<span className='p-1'>{selectedItem?.unit}</span>
									</td>

									{/* EDIT MODE: Close/Save Button */}
									<td className='p-2 text-center'>
										<button 
											onClick={() => setEditingRecipeId(null)}
											className="text-emerald-600 font-medium text-sm px-2 cursor-pointer"
										>
											Done
										</button>
									</td>
										</>
									): (
									<>
										<td 
											onClick={() => setEditingRecipeId(item.id)}
											className='w-2/5'>{itemById[item.item_id].name}</td>
										<td 
											onClick={() => setEditingRecipeId(item.id)}
											className='w-2/5'>{item.quantity} {item.unit}</td>
										<td className='flex flex-row justify-center gap-2 p-2'>
											<button 
												onClick={() => setEditingRecipeId(item.id)}
												className='cursor-pointer hover:scale-110'>
												<PenIcon />
											</button>
											<button 
												onClick={() => onDeleteRecipeItem(product.id, item.id)}
												className='text-red-500 cursor-pointer hover:scale-110'>
												<TrashIcon />
											</button>
										</td>
									</>
									)
									}
								</tr>
							)
						})}

						{newRecipeItems.map((item, idx) => {
							const selectedItem = items.find( i => i.id === item.item_id)
							return (
								<tr key={idx}>

							    {/* Item Dropdown Selection */}
							    <td>
							      <select
								className='w-2/3 border border-neutral-700 rounded-lg py-1 px-2 text-center'
								value={item.item_id}
								onChange={(e) => handleItemChange(idx, 'item_id', e.target.value)}
							      >
								<option value="" disabled>Select an item</option>
								{items.map((validItem) => (
								  <option key={validItem.id} value={validItem.id}>
								    {validItem.name}
								  </option>
								))}
							      </select>
							    </td>
							    
							    {/* Quantity Input */}
							    <td className='flex flex-row gap-2 justify-center py-1'>
							    <InputModal
								    className='w-1/3'
								    placeholder='Quantity'
								    type='number'
								    value={item.quantity || ''}
								    step="any"
								    onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
							    />
							    <span className='p-1'>{selectedItem.unit}</span>
							    </td>

							    {/* Remove item button */}
							    <td>
							    <button
							      type="button"
							      onClick={() => handleRemoveItem(idx)}
							      className="p-2 text-gray-400 hover:text-red-500 text-sm"
							      title="Remove item"
							    >
							      ✕
							    </button>
							    </td>
							  </tr>
							  )
							})}
							{recipeErrors && (
							<tr>
								<td>
								{recipeErrors.item_id && (<ErrorMessage message={recipeErrors.item_id}/>)}
								</td>
								<td>
								{recipeErrors.quantity && (<ErrorMessage message={recipeErrors.quantity}/>)}
								</td>
							</tr>
						)}
						</tbody>
						</table>
						): ( <p>No recipe setted</p>)}
					<button
						onClick={() => handleAddRecipeItem()} 
						className={`${buttonVariants.secondary}`}>
						Add item
					</button>
				</div>
				</>
			)}
			<div className="flex flex-col md:flex-row justify-between md:mx-4 gap-2 mt-4">
					<button
						onClick={onClose}
						className={`${buttonVariants.danger} border border-dashed w-full md:w-1/4`}>
						Cancel
					</button>
					<button 
						onClick={handleSubmit}
						disabled={submitting}
						className={`${buttonVariants.secondary} w-full md:w-1/4`}>
						{ submitting ? 'Editing' : 'Edit'}
					</button>
				</div>
		</ModalLayout>
	)
}
