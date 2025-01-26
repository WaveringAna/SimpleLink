import { ThemeProvider } from "@/components/theme-provider"
import { LinkForm } from './components/LinkForm'
import { LinkList } from './components/LinkList'
import { AuthForms } from './components/AuthForms'
import { AuthProvider, useAuth } from './context/AuthContext'
import { Button } from "@/components/ui/button"
import { Toaster } from './components/ui/toaster'
import { ModeToggle } from './components/mode-toggle'
import { useState } from 'react'

function AppContent() {
	const { user, logout } = useAuth()
	const [refreshCounter, setRefreshCounter] = useState(0)

	const handleLinkCreated = () => {
		setRefreshCounter(prev => prev + 1)
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<header className="border-b">
				<div className="container max-w-6xl mx-auto flex h-16 items-center justify-between px-4">
					<h1 className="text-2xl font-bold">SimpleLink</h1>
					<div className="flex items-center gap-4">
						{user ? (
							<>
								<span className="text-sm text-muted-foreground">Welcome, {user.email}</span>
								<Button variant="outline" size="sm" onClick={logout}>
									Logout
								</Button>
							</>
						) : (
							<span className="text-sm text-muted-foreground">A link shortening and tracking service</span>
						)}
						<ModeToggle />
					</div>
				</div>
			</header>

			<main className="flex-1 flex flex-col">
				<div className="container max-w-6xl mx-auto px-4 py-8 flex-1 flex flex-col">
					<div className="space-y-8 flex-1 flex flex-col justify-center">
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
			</main>
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