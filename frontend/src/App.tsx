import { MantineProvider, Container, Title, Stack } from '@mantine/core';
import { LinkForm } from './components/LinkForm';
import { LinkList } from './components/LinkList';
import { Link } from './types/api';

function App() {
	const handleLinkCreated = (link: Link) => {
		// You could update the list here or show a success message
		window.location.reload();
	};

	return (
		<MantineProvider withGlobalStyles withNormalizeCSS>
			<Container size="lg" py="xl">
				<Stack spacing="xl">
					<Title order={1}>URL Shortener</Title>
					<LinkForm onSuccess={handleLinkCreated} />
					<LinkList />
				</Stack>
			</Container>
		</MantineProvider>
	);
}

export default App;

