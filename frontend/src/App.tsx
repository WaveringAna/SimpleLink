import { ThemeProvider } from "@/components/theme-provider"
import { Button } from './components/ui/button'
import { LinkForm } from './components/LinkForm'
import { LinkList } from './components/LinkList'
import { AuthForms } from './components/AuthForms'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useState } from 'react'
import { Toaster } from './components/ui/toaster'

function AppContent() {
	const { user, logout } = useAuth()
	const [refreshCounter, setRefreshCounter] = useState(0)

	const handleLinkCreated = () => {
		// Increment refresh counter to trigger list refresh
		setRefreshCounter(prev => prev + 1)
	}

	return (
		<div className="min-h-screen flex flex-col">
			<div className="container max-w-6xl mx-auto py-8 flex-1 flex flex-col">
				<div className="space-y-8 flex-1 flex flex-col justify-center">
					<div className="flex items-center justify-between">
						<h1 className="text-3xl font-bold">SimpleLink</h1>
						{user ? (
							<div className="flex items-center gap-4">
								<p className="text-sm text-muted-foreground">Welcome, {user.email}</p>
								<Button variant="outline" onClick={logout}>
									Logout
								</Button>
							</div>
						) : (
							<div className="flex items-center gap-4">
								<p className="text-sm text-muted-foreground">A link shortening and tracking service</p>
							</div>
						)}
					</div>

					{user ? (
						<>
							<LinkForm onSuccess={handleLinkCreated} />
							<LinkList refresh={refreshCounter} />
						</>
					) : (
						<AuthForms />
					)}
				</div>
			</div>
		</div>
	)
}

function App() {
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<AuthProvider>
				<AppContent />
				<Toaster />
			</AuthProvider>
		</ThemeProvider>
	)
}

export default App