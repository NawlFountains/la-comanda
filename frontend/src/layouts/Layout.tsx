import { Outlet } from 'react-router-dom'
import Navbar from '../components/Navbar'

export default function Layout() {
	return (
		<div className='app-layout'>
			<Navbar/>
			<main className='main-container'>
				<Outlet />
			</main>
		</div>
	)
}
