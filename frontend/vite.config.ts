import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

export default defineConfig(() => ({
	plugins: [react(), tailwindcss()],
	server: {
		proxy: {
			'/api': {
				target: process.env.VITE_API_URL || 'http://localhost:8080',
				changeOrigin: true,
			},
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
}))
