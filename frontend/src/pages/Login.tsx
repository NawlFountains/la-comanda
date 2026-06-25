import {buttonVariants} from "../components/ButtonStyles"
import ErrorMessage from "../components/ErrorMessage"
import {useLogin} from "../hooks/useLogin"
import ScreenLayout from "../layouts/ScreenLayout"

export default function Login() {
	const { email, setEmail,
		password, setPassword,
		errors, loading,
		handleLogin } = useLogin()

	return (
		<>
		<ScreenLayout>
			<div className="bg-neutral-100 flex flex-col text-center items-center w-2/3 rounded-xl gap-7 p-2">
			 <h1 className="text-xl py-2">On login screen </h1>
			 <div>
			 <div className="flex flex-col sm:flex-row gap-2">
			 	<p className="sm:w-[90px] my-auto text-left text-neutral-600">
					Email
				</p>
				<input 
					value={email}
					onChange={e => setEmail(e.target.value)}
					className="p-2 border border-neutral-200 rounded-xl"
					placeholder="email"/>
			 </div>
			 {errors.email && (<ErrorMessage message={errors.email}/>)}
			 </div>
			 <div>
			 <div className="flex flex-col sm:flex-row gap-2">
			 	<p className="sm:w-[90px] my-auto text-left text-neutral-600">
			 	Password
			 </p>
				<input 
					value={password}
					onChange={e => setPassword(e.target.value)}
					className="p-2 border border-neutral-200 rounded-xl"
					placeholder="password"
					type="password"/>
			 </div>
			 {errors.password && (<ErrorMessage message={errors.password}/>)}
			 </div>
			<button 
				disabled={loading}
				onClick={() => handleLogin()}
				className={`${buttonVariants.base} w-1/3 mb-3 border border-neutral-600 rounded-lg`}>
				{ loading ? 'Logging...' : 'Log' }
			</button>
			</div>
		</ScreenLayout>
		</>
	)
}
