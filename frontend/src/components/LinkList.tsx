import { lazy, Suspense } from 'react'

import { useEffect, useState } from 'react'
import { Link } from '../types/api'
import { getAllLinks, deleteLink } from '../api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Copy, Trash2, BarChart2 } from "lucide-react"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog"

const StatisticsModal = lazy(() => import('./StatisticsModal'))

interface LinkListProps {
	refresh?: number;
}

export function LinkList({ refresh = 0 }: LinkListProps) {
	const [links, setLinks] = useState<Link[]>([])
	const [loading, setLoading] = useState(true)
	const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; linkId: number | null }>({
		isOpen: false,
		linkId: null,
	})
	const [statsModal, setStatsModal] = useState<{ isOpen: boolean; linkId: number | null }>({
		isOpen: false,
		linkId: null,
	});
	const { toast } = useToast()

	const fetchLinks = async () => {
		try {
			setLoading(true)
			const data = await getAllLinks()
			setLinks(data)
		} catch (err) {
			toast({
				title: "Error",
				description: "Failed to load links",
				variant: "destructive",
			})
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchLinks()
	}, [refresh]) // Re-fetch when refresh counter changes

	const handleDelete = async () => {
		if (!deleteModal.linkId) return

		try {
			await deleteLink(deleteModal.linkId)
			await fetchLinks()
			setDeleteModal({ isOpen: false, linkId: null })
			toast({
				description: "Link deleted successfully",
			})
		} catch (err) {
			toast({
				title: "Error",
				description: "Failed to delete link",
				variant: "destructive",
			})
		}
	}

	const handleCopy = (shortCode: string) => {
		// Use import.meta.env.VITE_BASE_URL or fall back to window.location.origin
		const baseUrl = window.location.origin
		navigator.clipboard.writeText(`${baseUrl}/${shortCode}`)
		toast({
			description: (
				<>
					Link copied to clipboard
					<br />
					You can add ?source=TextHere to the end of the link to track the source of clicks
				</>
			),
		})
	}

	if (loading && !links.length) {
		return <div className="text-center py-4">Loading...</div>
	}

	return (
		<>
			<Dialog open={deleteModal.isOpen} onOpenChange={(open) => setDeleteModal({ isOpen: open, linkId: null })}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Delete Link</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete this link? This action cannot be undone.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeleteModal({ isOpen: false, linkId: null })}>
							Cancel
						</Button>
						<Button variant="destructive" onClick={handleDelete}>
							Delete
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			<Card>
				<CardHeader>
					<CardTitle>Your Links</CardTitle>
					<CardDescription>Manage and track your shortened links</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="rounded-md border">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Short Code</TableHead>
									<TableHead className="hidden md:table-cell">Original URL</TableHead>
									<TableHead>Clicks</TableHead>
									<TableHead className="hidden md:table-cell">Created</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{links.map((link) => (
									<TableRow key={link.id}>
										<TableCell className="font-medium">{link.short_code}</TableCell>
										<TableCell className="hidden md:table-cell max-w-[300px] truncate">
											{link.original_url}
										</TableCell>
										<TableCell>{link.clicks}</TableCell>
										<TableCell className="hidden md:table-cell">
											{new Date(link.created_at).toLocaleDateString()}
										</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => handleCopy(link.short_code)}
												>
													<Copy className="h-4 w-4" />
													<span className="sr-only">Copy link</span>
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8"
													onClick={() => setStatsModal({ isOpen: true, linkId: link.id })}
												>
													<BarChart2 className="h-4 w-4" />
													<span className="sr-only">View statistics</span>
												</Button>
												<Button
													variant="ghost"
													size="icon"
													className="h-8 w-8 text-destructive"
													onClick={() => setDeleteModal({ isOpen: true, linkId: link.id })}
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">Delete link</span>
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				</CardContent>
			</Card>
			{statsModal.isOpen && (
				<Suspense fallback={<div>Loading...</div>}>
					<StatisticsModal
						isOpen={statsModal.isOpen}
						onClose={() => setStatsModal({ isOpen: false, linkId: null })}
						linkId={statsModal.linkId!}
					/>
				</Suspense>
			)}
		</>
	)
}