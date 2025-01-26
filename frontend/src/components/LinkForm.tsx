import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CreateLinkRequest } from '../types/api'
import { createShortLink } from '../api/client'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LinkIcon } from "lucide-react"
import {
	Form,
	FormControl,
	FormField,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"

const formSchema = z.object({
	url: z.string()
		.min(1, 'URL is required')
		.url('Must be a valid URL')
		.refine(val => val.startsWith('http://') || val.startsWith('https://'), {
			message: 'URL must start with http:// or https://'
		}),
	custom_code: z.string()
		.regex(/^[a-zA-Z0-9_-]{0,32}$/, 'Custom code must contain only letters, numbers, underscores, and hyphens')
		.optional()
})

interface LinkFormProps {
	onSuccess: () => void;
}

export function LinkForm({ onSuccess }: LinkFormProps) {
	const [loading, setLoading] = useState(false)
	const { toast } = useToast()

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			url: '',
			custom_code: '',
		},
	})

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		try {
			setLoading(true)
			await createShortLink(values as CreateLinkRequest)
			form.reset()
			onSuccess() // Call the onSuccess callback to trigger refresh
			toast({
				description: "Short link created successfully",
			})
		} catch (err: any) {
			toast({
				variant: "destructive",
				title: "Error",
				description: err.response?.data?.error || 'An error occurred',
			})
		} finally {
			setLoading(false)
		}
	}

	return (
		<Card className="mb-8">
			<CardHeader>
				<CardTitle>Create Short Link</CardTitle>
				<CardDescription>Enter a URL to generate a shortened link</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4 md:flex-row md:items-end">
						<FormField
							control={form.control}
							name="url"
							render={({ field }) => (
								<div className="flex-1 space-y-2">
									<FormLabel>URL</FormLabel>
									<FormControl>
										<div className="relative">
											<LinkIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
											<Input placeholder="https://example.com" className="pl-9" {...field} />
										</div>
									</FormControl>
									<FormMessage />
								</div>
							)}
						/>

						<FormField
							control={form.control}
							name="custom_code"
							render={({ field }) => (
								<div className="w-full md:w-1/4 space-y-2">
									<FormLabel>Custom Code <span className="text-muted-foreground">(optional)</span></FormLabel>
									<FormControl>
										<Input placeholder="custom-code" {...field} />
									</FormControl>
									<FormMessage />
								</div>
							)}
						/>

						<Button type="submit" disabled={loading} className="md:w-auto">
							{loading ? "Creating..." : "Create Short Link"}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	)
}