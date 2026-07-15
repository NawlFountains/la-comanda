import type { ProductUpdateData, ProductErrors } from '../../schemas/product'
import type { PriceHistoryCreateData, PriceHistoryErrors } from '../../schemas/price_history'
import type { RecipeItemCreateData, RecipeItemUpdateData, RecipeItemErrors }  from '../../schemas/recipe_item'

export interface ProductEditActions {
	onEdit: (id: string, data: ProductUpdateData) => Promise<boolean>
	validateProductUpdate: (data: ProductUpdateData) => boolean
	errors: ProductErrors
	submitting: boolean
	loading: boolean
}

export interface PriceActions {
	onAdd: (productId: string, data: PriceHistoryCreateData) => Promise<boolean>
	validatePrice: (data: PriceHistoryCreateData) => boolean
	errors: PriceHistoryErrors
	submitting: boolean
}

export interface RecipeItemActions {
	onAdd: (productId: string, data: RecipeItemCreateData) => Promise<boolean>
	onEdit: (productId: string, id: string, data: RecipeItemUpdateData) => Promise<boolean>
	onDelete: (productId: string, id: string) => void
	validateRecipe: (data: RecipeItemCreateData) => boolean
	validateRecipeUpdate: (data: RecipeItemUpdateData) => boolean
	submitting: boolean
	errors: RecipeItemErrors
}

