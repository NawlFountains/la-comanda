import {buttonVariants} from "../components/ButtonStyles"
import ErrorMessage from "../components/ErrorMessage"
import { useLogin } from "../hooks/useLogin"
import { useState } from "react"
import ScreenLayout from "../layouts/ScreenLayout"
import {EyeIcon, EyeSlashIcon} from "../components/Icons"
import { Link } from "react-router-dom"

export default function Login() {
	const { email, setEmail,
		password, setPassword,
		errors, loading,
		handleLogin } = useLogin()
	const [showPassword, setShowPassword] = useState(false)

	return (
		<>
		<ScreenLayout>
			<div className="bg-neutral-100 flex flex-col text-center items-center w-full max-w-xl rounded-xl gap-8 p-4 shadow-lg h-full sm:h-1/2 sm:my-auto justify-center text-xl">

			<div className="relative flex flex-col gap-2 py-4 w-full">
			<Link 
				className="absolute left-0 text-neutral-600 hover:text-neutral-700 hidden sm:flex"
				to="/">
				{`> Back`}
			</Link>
				 <h1 className="text-3xl font-bold">La comanda</h1>
				 <h2 className="text-2xl text-neutral-700">Sign into your account</h2>
			</div>

			{/* Email input */}
			 <div className="flex flex-col w-full max-w-sm">
			 <input 
				 value={email}
				 onChange={e => setEmail(e.target.value)}
				 aria-invalid={!!errors.email}
				 aria-describedby={errors.email ? "email-error" : undefined}
				 className="p-3 px-4 border rounded-xl placeholder-neutral-600 focus:border-red-200 aria-invalid:border-red-500"
				 placeholder="email"/>
				 {errors.email && (
					 <div id="email-error">
					 <ErrorMessage message={errors.email}/>
					 </div>
				 )}
			 </div>

			 {/* Password input */}
			 <div className="flex flex-col w-full max-w-sm">
				 <div className="relative flex items-center">
				 <input 
					 value={password}
					 onChange={e => setPassword(e.target.value)}
					 aria-invalid={!!errors.password}
					 aria-describedby={errors.password ? "password-error" : undefined}
					 className="p-3 px-4 border rounded-xl placeholder-neutral-600 focus:border-red-200 aria-invalid:border-red-500 w-full"
					 placeholder="password"
					 type={showPassword ? "text" : "password"}/>
					 
					 <button
					 type="button"
					 onClick={() => setShowPassword(!showPassword)}
					 className="absolute right-3 text-neutral-500 hover:text-neutral-700"
					 aria-label={showPassword ? "Hide password" : "Show password"}
					 >
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
				className={`${buttonVariants.primary} p-3 w-full max-w-sm mb-3 border border-neutral-600 rounded-lg`}>
				{ loading ? 'Signing in...' : 'Sign in' }
			</button>
			</div>
		</ScreenLayout>
		</>
	)
}
