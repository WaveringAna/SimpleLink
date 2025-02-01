// src/components/EditModal.tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from '../types/api';
import { editLink } from '../api/client';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

const formSchema = z.object({
    url: z
        .string()
        .min(1, 'URL is required')
        .url('Must be a valid URL')
        .refine((val) => val.startsWith('http://') || val.startsWith('https://'), {
            message: 'URL must start with http:// or https://',
        }),
    custom_code: z
        .string()
        .regex(/^[a-zA-Z0-9_-]{1,32}$/, {
            message:
                'Custom code must be 1-32 characters and contain only letters, numbers, underscores, and hyphens',
        })
        .optional(),
});

interface EditModalProps {
    isOpen: boolean;
    onClose: () => void;
    link: Link;
    onSuccess: () => void;
}

export function EditModal({ isOpen, onClose, link, onSuccess }: EditModalProps) {
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            url: link.original_url,
            custom_code: link.short_code,
        },
    });

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        try {
            setLoading(true);
            await editLink(link.id, values);
            toast({
                description: 'Link updated successfully',
            });
            onSuccess();
            onClose();
        } catch (err: unknown) {
            const error = err as { response?: { data?: { error?: string } } };
            toast({
                variant: 'destructive',
                title: 'Error',
                description: error.response?.data?.error || 'Failed to update link',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Link</DialogTitle>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="url"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Destination URL</FormLabel>
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
                                    <FormLabel>Short Code</FormLabel>
                                    <FormControl>
                                        <Input placeholder="custom-code" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
