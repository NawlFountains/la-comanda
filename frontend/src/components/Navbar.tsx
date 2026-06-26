import { NavLink, useRouteLoaderData } from "react-router-dom"
import type { User } from '@supabase/supabase-js'
import useLogout from "../hooks/useLogout"
import { useState } from "react"
import { buttonVariants } from "./ButtonStyles"

interface StyledNavLinkProps {
	to: string
	children: React.ReactNode
}

function StyledNavLink({to, children}: StyledNavLinkProps) {
	return (
		<div className={`${buttonVariants.base}`}>
			<NavLink to={to}>{children}</NavLink>
		</div>
	)
}

export default function Navbar() {
	const user = useRouteLoaderData('root-layout') as User | null
	const { loading, handleLogout } = useLogout()
	const [ menuOpen, setMenuOpen ] = useState(false)

	const navlink_paths = [
		{
			"to": '/',
			"title": 'Home',
		},
		{
			"to": "/dashboard",
			"title": "Dashboard"
		},
		{
			"to": "/orders",
			"title": "Orders"
		},
		{
			"to": "/stock",
			"title": "Stock"
		}
	]

	return (
		<nav className="bg-neutral-100">

		{/* HORIZONTAL MENU */}
		<div className="text-xl flex-row hidden md:flex w-full justify-between p-2">
			<div className="my-auto">
			<NavLink to ="/">La comanda</NavLink>
			</div>
			<div className="flex flex-row gap-4 my-auto">
			{ navlink_paths.map((navlink, idx) => (
				<span key={idx}>
					<StyledNavLink to={navlink.to}>{navlink.title}</StyledNavLink>
				</span>
			))}
			</div>
			{user ? (
				<div>
				<span>{user.email} </span>
				<button
					onClick={handleLogout}
					disabled={loading}
					className={`${buttonVariants.danger}`}>
					{ loading ? 'Logging out...' : 'Log out'}
				</button>
				</div>
			) : (
				<StyledNavLink to='/login'>Log in</StyledNavLink>
			)}
		</div>
	
		{/* VERTICAL MENU */}
		<div className="text-xl md:hidden flex flex-col pt-2 gap-2">
			<div className="flex flex-row justify-between px-4">
				<div className="p-2">
				<NavLink to ="/">La comanda</NavLink>
				</div>
				<button 
					onClick={() => setMenuOpen(prev => !prev)} 
					className="flex flex-col justify-center items-center w-8 h-8 gap-[6px] cursor-pointer group my-auto">
					<span className={`h-[3px] w-6 bg-neutral-800 rounded-full transition-all duration-300 ease-in-out ${
						menuOpen ? "rotate-45 translate-y-[9px]" : ""
					}`} />

					<span className={`h-[3px] w-6 bg-neutral-800 rounded-full transition-all duration-300 ease-in-out ${
						menuOpen ? "opacity-0 scale-0" : ""
					}`} />

					<span className={`h-[3px] w-6 bg-neutral-800 rounded-full transition-all duration-300 ease-in-out ${
						menuOpen ? "-rotate-45 -translate-y-[9px]" : ""
					}`} />
				</button>
			</div>

			{/* Menu open */}
			<div
				className={`text-center transition-all duration-200 ease-in-out 
					${menuOpen
						? 'max-h-96 opacity-100 pointer-events-auto'
						: 'max-h-0 opacity-0 pointer-events-none'}`}>
				<div className="text-center">
					<ul className="divide-y divide-neutral-300">
					{navlink_paths.map((navlink, idx) => (
						<li key={idx}>
							<StyledNavLink to={navlink.to}>{navlink.title}</StyledNavLink>
						</li>
					))}
					<li>
					{user ? (
						<button
							onClick={handleLogout}
							disabled={loading}
							className={`${buttonVariants.danger} w-full`}>
						{ loading ? 'Logging out...' : 'Log out'}
						</button>
					) : (
						<StyledNavLink to='/login'>Log in</StyledNavLink>
					)}
					</li>
					</ul>
				</div>
			</div>
		</div>
		</nav>
	)
}
