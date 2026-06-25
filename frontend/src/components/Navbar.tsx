import { NavLink, useRouteLoaderData } from "react-router-dom"
import type { User } from '@supabase/supabase-js'
import { supabase } from "../supabase/supabaseClient"
import useLogout from "../hooks/useLogout"

interface StyledNavLinkProps {
	to: string
	children: React.ReactNode
}

function StyledNavLink({to, children}: StyledNavLinkProps) {
	return (
		<div className="bg-neutral-100 text-md">
			<NavLink to={to}>{children}</NavLink>
		</div>
	)
}

export default function Navbar() {
	const user = useRouteLoaderData('root-layout') as User | null
	const { handleLogout } = useLogout()
	return (
		<nav>
		<div className="text-xl">
			<div className="bg-gray-200">
			<NavLink to ="/">La comanda</NavLink>
			</div>
			<ul className="bg-gray-300">
			<li>
			</li>
				<li>
				<StyledNavLink to='/'>Home</StyledNavLink>
				</li>
				<li>
				<StyledNavLink to="/dashboard">Dashboard</StyledNavLink>
				</li>
				<li>
				<StyledNavLink to ="/orders">Orders</StyledNavLink>
				</li>
			</ul>
			{user ? (
				<div>
				<span>{user.email}</span>
				<button
					onClick={handleLogout}
					className="bg-red-500 rounded-xl py-2 px-4 text-neutral-100 cursor-pointer">
				Log out
				</button>
				</div>
			) : (
				<StyledNavLink to='/login'>Log in</StyledNavLink>
			)}
		</div>
		</nav>
	)
}
