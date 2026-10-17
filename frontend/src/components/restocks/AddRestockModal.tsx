import {useState} from 'react'
import {useTranslation} from 'react-i18next'
import ModalLayout from '../../layouts/ModalLayout'
import type { RestockCreateData, RestockErrors, RestockItemCreateData } from '../../schemas/restock'
import type { Item } from '../../types'
import {buttonVariants} from '../styles/ButtonStyles'
import InputModal from '../InputModal'
import ErrorMessage from '../errors/ErrorMessage'

interface AddRestockModalProps {
	onClose: () => void
	onCreate: (data: RestockCreateData) => Promise<boolean>
	validateRestock: (data: RestockCreateData) => boolean
	items: Item[]
	submitting: boolean
	errors: RestockErrors
}

export default function AddRestockModal({ onClose, onCreate, validateRestock, items, submitting, errors }: AddRestockModalProps) {
	const { t } = useTranslation()
	const [supplier, setSupplier] = useState<string>('')
	const [notes, setNotes] = useState<string>('')
	const [restockDate, setRestockDate] = useState<string>( () => {
		return new Date().toISOString().split('T')[0]
	})
	const [restockItems, setRestockItems] = useState<RestockItemCreateData[]>([]) 

	const handleSubmit = async () => {
		const restockData = ({
			restock_date: restockDate,
			supplier,
			notes,
			restock_items : restockItems

		})
		if (!validateRestock(restockData)) return
		onClose()
		onCreate(restockData)
	}
	
	const handleAddRestockItem = () => {
		const newRestockItem: RestockItemCreateData = {
			item_id: items[0]?.id || '',
			quantity: 1
		}

		setRestockItems([...restockItems, newRestockItem])
	}

	const handleItemChange = (index: number, field: keyof RestockItemCreateData, value: string | number) => {
		const updatedItems = [...restockItems]
		updatedItems[index] = {
			...updatedItems[index],
			[field]: value
		} as RestockItemCreateData 
		setRestockItems(updatedItems)
	}

	const handleRemoveItem = (index: number) => {
		setRestockItems(restockItems.filter((_, i) => i !== index))
	}

	return (
		<ModalLayout onClose={onClose}>
			<div className='p-2'>
				<h1 className='text-center text-lg font-mono'>{t("restocks.addRestock")}</h1>
			</div>
			<div className='flex flex-col'>
				<InputModal 
					id="restockDate"
					type="date"
					label={t("restocks.date")}
					value={restockDate}
					onChange={(e) => setRestockDate(e.target.value)}/>
				{errors.restock_date && (<ErrorMessage message={errors.restock_date}/>)}
			</div>
			<div className='flex flex-col md:grid md:grid-cols-2 gap-4'>
				<div className='flex flex-col'>
					<InputModal 
						placeholder='e.g. Supermarket'
						id="restockSupplier"
						label={t("restocks.supplier")}
						value={supplier}
						onChange={(e) => setSupplier(e.target.value)}/>
					{errors.supplier && (<ErrorMessage message={errors.supplier} />)}
				</div>
				<div className='flex flex-col'>
					<InputModal 
						placeholder={t("common.fields.notes")}
						id="restockNotes"
						label={t("common.fields.notes")}
						value={notes}
						onChange={(e) => setNotes(e.target.value)}/>
					{errors.notes && (<ErrorMessage message={errors.notes} />)}
				</div>
				
			</div>
			<div className='flex flex-col gap-2'>
				<h2 className='text-center text-xl font-mono'>{t("restocks.items")}</h2>
				{restockItems.map((item, index) => {
					const selectedItem = items.find( i => i.id === item.item_id)
					
				  return (
					  <div key={index} className='flex flex-row gap-2 items-center pb-2'>

				    {/* Item Dropdown Selection */}
				    <div className='w-full flex-1'>
					<fieldset className="border border-neutral-400 dark:border-neutral-600 rounded-lg px-2 pb-1">
						<legend className="text-xs px-1 text-neutral-600 dark:text-neutral-200">{t("common.fields.item")}</legend>
				      <select
				      	className='dark:bg-neutral-800 w-full py-1 px-2'
					value={item.item_id}
					id={`restockItem${index}Id`}
					onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
				      >
					<option value="" disabled>{t("items.selectAnItem")}</option>
					{items.map((validItem) => (
					  <option key={validItem.id} value={validItem.id}>
					    {validItem.name}
					  </option>
					))}
				      </select>
				      </fieldset>
				    </div>
				    
				    {/* Quantity Input */}
				    <div className='w-32 flex flex-row gap-2 items-center'>
				    <InputModal
				    	className='w-full'
					    placeholder='e.g 3'
					    id={`restockItem${index}Quantity`}
					    label={t("common.fields.quantity")}
					    type='number'
					    value={item.quantity || ''}
					    step="any"
					    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
				    />
				    <span className='p-1'>{selectedItem?.unit}</span>
				    </div>

				    {/* Remove item button */}
				    <button
				      type="button"
				      onClick={() => handleRemoveItem(index)}
				      className="p-2 text-gray-400 hover:text-red-500 text-sm"
				      title="Remove item"
				    >
				      ✕
				    </button>
				  </div>
				  )
				})}
				<button
					onClick={() => handleAddRestockItem()}
					className={buttonVariants.secondary}>
					+ {t("items.addItem")}
				</button>
				{errors.restock_items && (<ErrorMessage message={errors.restock_items} /> )}
				</div>

			<div className="flex flex-col md:flex-row justify-between md:mx-4 gap-2 mt-4">
					<button
						onClick={onClose}
						className={`${buttonVariants.danger} border border-dashed w-full md:w-1/4`}>
						{t("common.actions.cancel")}
					</button>
					<button 
						onClick={handleSubmit}
						disabled={submitting}
						className={`${buttonVariants.secondary} w-full md:w-1/4`}>
						{submitting ? t("common.actions.adding") : t("common.actions.add")}
					</button>
				</div>
		</ModalLayout>
	)
}
