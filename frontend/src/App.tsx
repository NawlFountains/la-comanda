import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom' 
import { protectedLoader, loginLoader } from './routes/authLoader'
import Layout from './layouts/Layout'

import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Login from './pages/Login'

const router = createBrowserRouter([
	{
		path: '/',
		element: <Layout/>,
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
			}
		]
	},
	{
		path: '/login',
		element: <Login />,
		loader: loginLoader
	}
])
export default function App() {

  return <RouterProvider router={router}/>
}

