import {buttonVariants} from "../components/styles/ButtonStyles"
import ErrorMessage from "../components/errors/ErrorMessage"
import { useLogin } from "../hooks/useLogin"
import { useState } from "react"
import {EyeIcon, EyeSlashIcon} from "../components/styles/Icons"
import { Link } from "react-router-dom"
import AuthLayout from "../layouts/AuthLayout"
import InputModal from "../components/InputModal"

export default function Login() {
	const { email,
		setEmail,
		password, 
		setPassword,
		errors, 
		loading,
		handleLogin
	} = useLogin()
	const [showPassword, setShowPassword] = useState(false)

	return (
		<AuthLayout>
			<div className="bg-neutral-100 dark:bg-neutral-800 flex flex-col text-center items-center justify-center min-h-full w-full max-w-xl rounded-xl gap-8 p-4 sm:shadow-lg text-lg">

			<div className="relative flex flex-col gap-2 py-4 w-full">
			<Link 
				className="absolute left-0 text-neutral-600 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hidden sm:flex"
				to="/">
				{`> Back`}
			</Link>
				 <h1 className="text-3xl font-bold">La comanda</h1>
				 <h2 className="text-2xl text-neutral-700 dark:text-neutral-400">Sign into your account</h2>
			</div>

			{/* Email input */}
			<div className="flex flex-col w-full max-w-sm">
			 <InputModal
				 value={email}
				 onChange={e => setEmail(e.target.value)}
				 id="email"
				 label="email"
				 className="w-full h-10"
				 placeholder="email@example.com"/>
				 {errors.email && (
					 <div id="email-error">
					 <ErrorMessage message={errors.email}/>
					 </div>
				 )}
			 </div>

			 {/* Password input */}
			 <div className="flex flex-col w-full max-w-sm">
				 <div className="relative flex items-center">
				 	<div className="w-full">
						 <InputModal
							 value={password}
							 onChange={e => setPassword(e.target.value)}
							 id="password"
							 label="password"
							 className="w-full h-10"
							 placeholder="password"
							 type={showPassword ? "text" : "password"}
						 />
					</div>
					 
					 <button
						 type="button"
						 onClick={() => setShowPassword(!showPassword)}
						 className="absolute right-3 top-6 text-neutral-500 hover:text-neutral-700"
						 aria-label={showPassword ? "Hide password" : "Show password"}>
						 {showPassword ? (
							 <EyeIcon/>
						 ) : (
							 <EyeSlashIcon/>
						 )}
					 </button>
				 </div>
				 {errors.password && (
						 <div id="password-error">
						 <ErrorMessage message={errors.password}/>
						 </div>
					 )}
			 </div>

			<button 
				disabled={loading}
				onClick={() => handleLogin()}
				className={`${buttonVariants.primary} w-full max-w-sm mb-3 border border-neutral-600 rounded-lg`}>
				{ loading ? 'Signing in...' : 'Sign in' }
			</button>
			<p>
				New here? <Link className="font-bold cursor-pointer" to="/register">Create your account</Link>
			</p>
			</div>
		</AuthLayout>
	)
}
