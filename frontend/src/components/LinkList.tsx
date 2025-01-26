import { useEffect, useState } from 'react'
import { Link } from '../types/api'
import { getAllLinks, deleteLink } from '../api/client'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface LinkListProps {
	refresh: number
}

export function LinkList({ refresh }: LinkListProps) {
	const [links, setLinks] = useState<Link[]>([])
	const [loading, setLoading] = useState(true)
	const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; linkId: number | null }>({
		isOpen: false,
		linkId: null,
	})
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
	}, [refresh])

	const handleDelete = async () => {
		if (!deleteModal.linkId) return

		try {
			await deleteLink(deleteModal.linkId)
			await fetchLinks()
			setDeleteModal({ isOpen: false, linkId: null })
			toast({
				title: "Link deleted",
				description: "The link has been successfully deleted.",
			})
		} catch (err) {
			toast({
				title: "Error",
				description: "Failed to delete link",
				variant: "destructive",
			})
		}
	}

	if (loading && !links.length) {
		return <div className="text-center py-4">Loading...</div>
	}

	return (
		<div className="space-y-4">
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

			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Short Code</TableHead>
						<TableHead>Original URL</TableHead>
						<TableHead>Clicks</TableHead>
						<TableHead>Created</TableHead>
						<TableHead>Actions</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{links.map((link) => (
						<TableRow key={link.id}>
							<TableCell>{link.short_code}</TableCell>
							<TableCell className="max-w-[300px] truncate">{link.original_url}</TableCell>
							<TableCell>{link.clicks}</TableCell>
							<TableCell>{new Date(link.created_at).toLocaleDateString()}</TableCell>
							<TableCell>
								<div className="flex gap-2">
									<Button
										variant="secondary"
										size="sm"
										onClick={() => {
											navigator.clipboard.writeText(`http://localhost:8080/${link.short_code}`)
											toast({ description: "Link copied to clipboard" })
										}}
									>
										Copy
									</Button>
									<Button
										variant="destructive"
										size="sm"
										onClick={() => setDeleteModal({ isOpen: true, linkId: link.id })}
									>
										Delete
									</Button>
								</div>
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}