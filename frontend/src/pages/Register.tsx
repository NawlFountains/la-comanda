import {useState} from 'react'
import AuthLayout from '../layouts/AuthLayout'
import { buttonVariants } from '../components/styles/ButtonStyles'
import { EyeIcon, EyeSlashIcon } from '../components/styles/Icons'
import { Link } from 'react-router-dom'
import {useRegister} from '../hooks/useRegister'
import ErrorMessage from '../components/errors/ErrorMessage'
import InputModal from '../components/InputModal'

export default function Register () {
	const {
		email,
		setEmail,
		password,
		setPassword,
		confirmPassword,
		setConfirmPassword,
		name,
		setName,
		phone,
		setPhone,
		loading,
		registerErrors,
		businessErrors,
		handleRegister
	} = useRegister()

	const [showPassword, setShowPassword] = useState(false)

	return (
		<AuthLayout>
			<div className="bg-neutral-100 flex flex-col text-center items-center justify-center min-h-full w-full max-w-xl rounded-xl gap-8 p-4 sm:shadow-lg text-lg">

			<div className="relative flex flex-col gap-2 py-4 w-full">
			<Link 
				className="absolute left-0 text-neutral-600 hover:text-neutral-700 hidden sm:flex"
				to="/">
				{`> Back`}
			</Link>
				 <h1 className="text-3xl font-bold">La comanda</h1>
				 <h2 className="text-2xl text-neutral-700">Create your account</h2>
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
				 {registerErrors.email && (
					 <div id="email-error">
					 <ErrorMessage message={registerErrors.email}/>
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
				 {registerErrors.password && (
						 <div id="password-error">
						 <ErrorMessage message={registerErrors.password}/>
						 </div>
					 )}
			 </div>

			 {/*Confirm password */}
			 <div className="flex flex-col w-full max-w-sm">
				 <div className="relative flex items-center">
				 	<div className="w-full">
						 <InputModal
							 value={confirmPassword}
							 onChange={e => setConfirmPassword(e.target.value)}
							 id="confirm-password"
							 label="confirm password"
							 className="w-full h-10"
							 placeholder="Confirm password"
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
				 {registerErrors.confirmPassword && (
						 <div id="confirm-password-error">
						 <ErrorMessage message={registerErrors.confirmPassword}/>
						 </div>
					 )}
			 </div>

			 <div className='border-b pb-2'>
			 <h2 className='font-mono text-lg text-neutral-800'>Business information</h2>
			 </div>

			 {/* Business name*/}
			 <div className="flex flex-col w-full max-w-sm">
				 <InputModal
					 value={name}
					 onChange={e => setName(e.target.value)}
					 id="name"
					 label="name"
					 className="w-full h-10"
					 placeholder="e.g. La comanda"/>
					 {businessErrors.name && (
						 <div id="name-error">
						 <ErrorMessage message={businessErrors.name}/>
						 </div>
					 )}
			 </div>

			 {/* Business phone (Optional) */}
			 <div className="flex flex-col w-full max-w-sm">
				 <InputModal
					 value={phone}
					 onChange={e => setPhone(e.target.value)}
					 id="phone"
					 label="phone (optional)"
					 className="w-full h-10"
					 placeholder="e.g. +123456789123"/>
					 {businessErrors.phone && (
						 <div id="phone-error">
						 <ErrorMessage message={businessErrors.phone}/>
						 </div>
					 )}
			 </div>

			<button 
				disabled={loading}
				onClick={() => handleRegister()}
				className={`${buttonVariants.primary} w-full max-w-sm mb-3 border border-neutral-600 rounded-lg`}>
				{ loading ? 'Registering...' : 'Register' }
			</button>
			<p>
				Already have an account? <Link className="font-bold" to="/login">Log in</Link>
			</p>
			</div>
		</AuthLayout>
	)
}
