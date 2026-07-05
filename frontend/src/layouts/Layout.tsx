import { Outlet, useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import type {Business} from '../types'
import { useEffect, useState } from 'react'
import {supabase} from '../supabase/supabaseClient'
import {getMyBusiness} from '../api/business'
import {LoadingSpinner} from '../components/Icons'
import ScreenLayout from './ScreenLayout'

export interface LayoutContextType {
	business: Business | null
	setBusiness: React.Dispatch<React.SetStateAction<Business | null>>
}

export default function Layout() {
	const [business, setBusiness] = useState<Business | null>(null)
	const [loading, setLoading] = useState(true)
	const location = useLocation()

	useEffect(() => {
		async function fetchBussinesOnLoad() {
			const { data } = await supabase.auth.getSession()

			if (data.session) {
				try {
					const biz = await getMyBusiness(data.session.access_token)
					setBusiness(biz)
				} catch (err) {
					console.error("Failed to load business profile:", err)
				}
			}
			setLoading(false)
		}

		fetchBussinesOnLoad()
	}, [])

	const isHomePage = location.pathname === '/'

	if (loading && !isHomePage) {
		return (
			<ScreenLayout>
				<div className='m-auto'>
				<LoadingSpinner size={50}/>
				</div>
			</ScreenLayout>
		)
	}

	return (
		<div className='app-layout'>
			<Navbar business={business}/>
			<main className='main-container'>
				<Outlet context={{ business, setBusiness } satisfies LayoutContextType}/>
			</main>
		</div>
	)
}
