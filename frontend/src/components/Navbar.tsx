import { NavLink } from "react-router-dom"

export default function Navbar() {
	return (
		<nav>
		<div>
			<div className="bg-gray-200">
			<NavLink to ="/">La comanda</NavLink>
			</div>
			<ul className="bg-gray-300">
				<li>
				<NavLink to ="/">Home</NavLink>
				</li>
				<li>
				<NavLink to ="/dashboard">Dashboard</NavLink>
				</li>
				<li>
				<NavLink to ="/orders">Orders</NavLink>
				</li>
			</ul>
		</div>
		</nav>
	)
}
