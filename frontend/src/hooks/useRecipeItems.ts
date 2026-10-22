import { useState, useCallback } from 'react'
import { useTranslation } from "react-i18next"
import { recipeItemCreateSchema, recipeItemUpdateSchema } from '../schemas/recipe_item'
import { createRecipeItem, deleteRecipeItem, updateRecipeItem } from '../api/products'
import type { RecipeItemCreateData, RecipeItemErrors, RecipeItemUpdateData } from '../schemas/recipe_item'
import type {  RecipeItem, ProductWithDetails } from '../types'
import { useToast } from '../context/ToastContext'
import { useValidation } from './useValidation'

export const useRecipeItems = (setProducts: React.Dispatch<React.SetStateAction<ProductWithDetails[]>>) => {
	const { t } = useTranslation(undefined, { keyPrefix: "recipeItems.toast"})
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
			showToast(t("added"), 'message')
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
			showToast(`${"addError"}: ${message}`)
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
			showToast(t("updated"), `message`)
			return true
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`${t("updateError")}: ${message}`)
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
			showToast(t("deleted"), `message`)
		} catch (err) {
			const message = err instanceof Error ? err.message : "Unknown error"
			showToast(`${(t("deleteError"))}: ${message}`)
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
