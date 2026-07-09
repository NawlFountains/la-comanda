import { createBrowserRouter, RouterProvider } from 'react-router-dom' 
import { protectedLoader, loginLoader, rootSessionLoader } from './routes/authLoader'
import Layout from './layouts/Layout'

import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Login from './pages/Login'
import Register from './pages/Register'
import Stock from './pages/Stock'
import Products from './pages/Products'
import ErrorFallback from './components/errors/ErrorFallback'

const router = createBrowserRouter([
	{
		path: '/',
		id: 'root-layout',
		element: <Layout/>,
		errorElement: <ErrorFallback />,
		loader: rootSessionLoader,
		children: [
			{
				index: true,
				element: <Home />
			},
			{
				path: 'dashboard',
				element: <Dashboard />,
				loader: protectedLoader
			},
			{
				path: 'orders',
				element: <Orders />,
				loader: protectedLoader
			},
			{
				path: 'stock',
				element: <Stock />,
				loader: protectedLoader
			},
			{
				path: 'products',
				element: <Products />,
				loader: protectedLoader
			}

		]
	},
	{
		path: '/login',
		element: <Login />,
		loader: loginLoader
	}, 
	{
		path: '/register',
		element: <Register />,
		loader: loginLoader
	}
])
export default function App() {

  return <RouterProvider router={router}/>
}

