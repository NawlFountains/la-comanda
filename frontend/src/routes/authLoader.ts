import { redirect } from "react-router-dom";
import { supabase } from "../supabase/supabaseClient";

export const protectedLoader = async () => {
	const { data: { session } } = await supabase.auth.getSession()

	if (!session) {
		return redirect('/login')
	}

	return session.user
}

export const loginLoader = async () => {
	const { data: { session } } = await supabase.auth.getSession()

	if (session) {
		return redirect('/dashboard')
	}
	return null
}
