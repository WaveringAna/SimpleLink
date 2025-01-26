import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { CreateLinkRequest, Link } from '../types/api'
import { createShortLink } from '../api/client'
import { Button } from "@/components/ui/button"
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
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
	onSuccess: (link: Link) => void
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
			const link = await createShortLink(values as CreateLinkRequest)
			form.reset()
			onSuccess(link)
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
		<div className="max-w-[500px] mx-auto">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
					<FormField
						control={form.control}
						name="url"
						render={({ field }) => (
							<FormItem>
								<FormLabel>URL</FormLabel>
								<FormControl>
									<Input placeholder="https://example.com" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<FormField
						control={form.control}
						name="custom_code"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Custom Code (optional)</FormLabel>
								<FormControl>
									<Input placeholder="example" {...field} />
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>

					<div className="flex justify-end">
						<Button type="submit" disabled={loading}>
							{loading ? "Creating..." : "Create Short Link"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	)
}

