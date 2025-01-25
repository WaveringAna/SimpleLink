import { useEffect, useState } from 'react';
import { Table, Text, Box, CopyButton, Button } from '@mantine/core';
import { Link } from '../types/api';
import { getAllLinks } from '../api/client';

export function LinkList() {
	const [links, setLinks] = useState<Link[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const fetchLinks = async () => {
		try {
			setLoading(true);
			const data = await getAllLinks();
			setLinks(data);
		} catch (err) {
			setError('Failed to load links');
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchLinks();
	}, []);

	if (loading) return <Text>Loading...</Text>;
	if (error) return <Text color="red">{error}</Text>;

	return (
		<Box>
			<Table>
				<thead>
					<tr>
						<th>Short Code</th>
						<th>Original URL</th>
						<th>Clicks</th>
						<th>Created</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{links.map((link) => (
						<tr key={link.id}>
							<td>{link.short_code}</td>
							<td>{link.original_url}</td>
							<td>{link.clicks}</td>
							<td>{new Date(link.created_at).toLocaleDateString()}</td>
							<td>
								<CopyButton value={`${window.location.origin}/${link.short_code}`}>
									{({ copied, copy }) => (
										<Button
											color={copied ? 'teal' : 'blue'}
											onClick={copy}
											size="xs"
										>
											{copied ? 'Copied' : 'Copy'}
										</Button>
									)}
								</CopyButton>
							</td>
						</tr>
					))}
				</tbody>
			</Table>
		</Box>
	);
}

