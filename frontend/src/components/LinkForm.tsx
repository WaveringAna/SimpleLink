import { useState } from 'react';
import { TextInput, Button, Group, Box, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { CreateLinkRequest, Link } from '../types/api';
import { createShortLink } from '../api/client';

interface LinkFormProps {
	onSuccess: (link: Link) => void;
}

export function LinkForm({ onSuccess }: LinkFormProps) {
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	const form = useForm<CreateLinkRequest>({
		initialValues: {
			url: '',
			custom_code: '',
		},
		validate: {
			url: (value) => {
				if (!value) return 'URL is required';
				if (!value.startsWith('http://') && !value.startsWith('https://')) {
					return 'URL must start with http:// or https://';
				}
				return null;
			},
			custom_code: (value) => {
				if (value && !/^[a-zA-Z0-9_-]{1,32}$/.test(value)) {
					return 'Custom code must be 1-32 characters and contain only letters, numbers, underscores, and hyphens';
				}
				return null;
			},
		},
	});

	const handleSubmit = async (values: CreateLinkRequest) => {
		try {
			setLoading(true);
			setError(null);
			const link = await createShortLink(values);
			form.reset();
			onSuccess(link);
		} catch (err) {
			setError(err.response?.data?.error || 'An error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<Box mx="auto" sx={{ maxWidth: 500 }}>
			<form onSubmit={form.onSubmit(handleSubmit)}>
				<TextInput
					required
					label="URL"
					placeholder="https://example.com"
					{...form.getInputProps('url')}
				/>

				<TextInput
					label="Custom Code (optional)"
					placeholder="example"
					mt="md"
					{...form.getInputProps('custom_code')}
				/>

				{error && (
					<Text color="red" size="sm" mt="sm">
						{error}
					</Text>
				)}

				<Group position="right" mt="md">
					<Button type="submit" loading={loading}>
						Create Short Link
					</Button>
				</Group>
			</form>
		</Box>
	);
}

