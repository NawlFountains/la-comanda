import { useState, useCallback } from 'react'
import { recipeItemCreateSchema, recipeItemUpdateSchema } from '../schemas/recipe_item'
import { createRecipeItem, deleteRecipeItem, updateRecipeItem } from '../api/products'
import type { RecipeItemCreateData, RecipeItemErrors, RecipeItemUpdateData } from '../schemas/recipe_item'
import type {  RecipeItem, ProductWithDetails } from '../types'
import { useToast } from '../context/ToastContext'
import { useValidation } from './useValidation'

export const useRecipeItems = (setProducts: React.Dispatch<React.SetStateAction<ProductWithDetails[]>>) => {
	const { showToast } = useToast()
	const { errors, validate, clearErrors} = useValidation<RecipeItemErrors>()
	const validateRecipe = useCallback((data: RecipeItemCreateData) => validate(recipeItemCreateSchema, data), [validate])
	const validateRecipeUpdate = useCallback((data: RecipeItemUpdateData) => validate(recipeItemUpdateSchema, data), [validate])
	const [submitting, setSubmitting] = useState<boolean>(false)


	const handleRecipeItemCreate = useCallback( async (productId: string, recipeItemData: RecipeItemCreateData): Promise<boolean> => {
		setSubmitting(true)

		const tempId = crypto.randomUUID()
		const optimisticRecipeItem: RecipeItem = { ...recipeItemData, product_id: productId, id: tempId }

		setProducts((prev) =>
			prev.map((p) =>
				p.id === productId
					? { ...p, recipe_items: [...p.recipe_items, optimisticRecipeItem] }
					: p
			)
		)
		try {
			const newRecipeItem: RecipeItem = await createRecipeItem(productId, recipeItemData)
			setProducts((prev) =>
				prev.map((p) =>
					p.id === productId
						? { ...p, recipe_items: p.recipe_items.map((r) => (r.id === tempId ? newRecipeItem : r)) }
						: p
				)
			)
			showToast('Recipe item created successfully', 'message')
			return true
		} catch (err) {
			setProducts((prev) =>
				prev.map((p) =>
					p.id === productId
						? { ...p, recipe_items: p.recipe_items.filter((r) => r.id !== tempId) }
						: p
				)
			)
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to create recipe item: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}
	}, [setProducts]) 

	const handleRecipeItemUpdate = useCallback( async (productId: string, recipeId: string, recipeItemData: RecipeItemUpdateData): Promise<boolean> => {
		setSubmitting(true)
		try {
			const updatedRecipeItem: RecipeItem = await updateRecipeItem(productId, recipeId, recipeItemData)

			setProducts((prevProducts) => 
				    prevProducts.map((product) => 
						product.id === productId
							? {
								...product,
								recipe_items: product.recipe_items.map((item) => 
									item.id === recipeId ? updatedRecipeItem : item
								)
							}
							: product
				    )
			)
			showToast(`Recipe item updated succesfully`, `message`)
			return true
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to update recipe item: ${message}`)
			return false
		} finally {
			setSubmitting(false)
		}
	} , [setProducts])


	const handleRecipeItemDelete = useCallback( async ( productId: string, id: string) => {
		setSubmitting(true)
		try {
			await deleteRecipeItem(productId, id)

			setProducts((prevProducts) => 
				prevProducts.map((product) => 
					product.id === productId 
						? { ...product, recipe_items: product.recipe_items.filter((item) => item.id !== id) }
						: product
				)
			)
			showToast(`Recipe item deleted succesfully`, `message`)
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`Failed to delete recipe item: ${message}`)
		} finally {
			setSubmitting(false)
		}
	}, [setProducts])

	return {
		validateRecipe,
		validateRecipeUpdate,
		handleRecipeItemCreate,
		handleRecipeItemUpdate,
		handleRecipeItemDelete,
		submitting,
		errors,
		clearErrors,
	}
}
