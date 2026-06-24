import { NavLink } from "react-router-dom"

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
		</div>
		</nav>
	)
}
