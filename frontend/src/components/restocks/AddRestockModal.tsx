import {useState} from 'react'
import ModalLayout from '../../layouts/ModalLayout'
import type { RestockErrors } from '../../schemas/restock'
import type { Item, CreateRestockPayload, CreateRestockItemPayload } from '../../types'
import {buttonVariants} from '../styles/ButtonStyles'
import InputModal from '../InputModal'
import ErrorMessage from '../errors/ErrorMessage'

interface AddRestockModalProps {
	onClose: () => void
	onCreate: (data: CreateRestockPayload) => Promise<boolean>
	items: Item[]
	submitting: boolean
	submitError: string | null
	errors: RestockErrors
}

export default function AddRestockModal({ onClose, onCreate, items, submitError, submitting, errors }: AddRestockModalProps) {
	const [supplier, setSupplier] = useState<string>('')
	const [notes, setNotes] = useState<string>('')
	const [restockDate, setRestockDate] = useState<string>( () => {
		return new Date().toISOString().split('T')[0]
	})
	const [restockItems, setRestockItems] = useState<CreateRestockItemPayload[]>([]) 

	const handleSubmit = async () => {
		const success = await onCreate({
			restock_date: restockDate,
			supplier,
			notes,
			restock_items : restockItems
		})
		if (success) onClose()
	}
	
	const handleAddRestockItem = () => {
		const newRestockItem: CreateRestockItemPayload = {
			item_id: items[0]?.id || '',
			quantity: 1
		}

		setRestockItems([...restockItems, newRestockItem])
	}

	const handleItemChange = (index: number, field: keyof CreateRestockItemPayload, value: string | number) => {
		const updatedItems = [...restockItems]
		updatedItems[index] = {
			...updatedItems[index],
			[field]: value
		} as CreateRestockItemPayload
		setRestockItems(updatedItems)
	}

	const handleRemoveItem = (index: number) => {
		setRestockItems(restockItems.filter((_, i) => i !== index))
	}

	return (
		<ModalLayout onClose={onClose}>
			<div className='p-2'>
				<h1 className='text-center text-xl font-mono'>Create restock</h1>
			</div>
			<div className='flex flex-col'>
				<InputModal 
					id="restockDate"
					type="date"
					label="Date"
					value={restockDate}
					onChange={(e) => setRestockDate(e.target.value)}/>
				{errors.restock_date && (<ErrorMessage message={errors.restock_date}/>)}
			</div>
			<div className='flex flex-col md:grid md:grid-cols-2 gap-4'>
				<div className='flex flex-col'>
					<InputModal 
						placeholder='e.g. Supermarket'
						id="restockSupplier"
						label="Supplier"
						value={supplier}
						onChange={(e) => setSupplier(e.target.value)}/>
					{errors.supplier && (<ErrorMessage message={errors.supplier} />)}
				</div>
				<div className='flex flex-col'>
					<InputModal 
						placeholder='Notes'
						id="restockNotes"
						label="Notes"
						value={notes}
						onChange={(e) => setNotes(e.target.value)}/>
					{errors.notes && (<ErrorMessage message={errors.notes} />)}
				</div>
				
			</div>
			<div className='flex flex-col gap-2'>
				<h2 className='text-center text-xl font-mono'>Restock items</h2>
				{restockItems.map((item, index) => {
					const selectedItem = items.find( i => i.id === item.item_id)
					
				  return (
					  <div key={index} className='flex flex-row gap-2 items-center pb-2'>

				    {/* Item Dropdown Selection */}
				    <div className='w-full flex-1'>
					<fieldset className="border border-neutral-400 rounded-lg px-2 pb-1">
						<legend className="text-xs px-1 text-neutral-600">Item</legend>
				      <select
				      	className='w-full py-1 px-2'
					value={item.item_id}
					id={`restockItem${index}Id`}
					onChange={(e) => handleItemChange(index, 'item_id', e.target.value)}
				      >
					<option value="" disabled>Select an item</option>
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
					    label="Quantity"
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
					+ Add item
				</button>
				{errors.restock_items && (<ErrorMessage message={errors.restock_items} /> )}
				</div>

			{submitError && (<ErrorMessage message={submitError} />)}
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
						{submitting ? 'Adding...' : 'Add'}
					</button>
				</div>
		</ModalLayout>
	)
}
