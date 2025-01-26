import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	const env = loadEnv(mode, process.cwd(), '')

	return {
		plugins: [
			react(),
			tailwindcss(),
		],
		server: {
			proxy: {
				'/api': {
					// Use environment variable with fallback
					target: env.VITE_API_URL || 'http://localhost:3000',
					changeOrigin: true,
				},
			},
		},
		resolve: {
			alias: {
				"@": path.resolve(__dirname, "./src"),
			},
		},
		base: '/',
		build: {
			outDir: 'dist',
			assetsDir: 'assets',
		},
	}
})
