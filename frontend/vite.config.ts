import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

export default defineConfig(({ command }) => {
	if (command === 'serve') { //command == 'dev'
		return {
			server: {
				proxy: {
					'/api': {
						target: process.env.VITE_API_URL || 'http://localhost:8080',
						changeOrigin: true,
					},
				},
			},
			plugins: [react(), tailwindcss()],
			resolve: {
				alias: {
					"@": path.resolve(__dirname, "./src"),
				},
			},
		}
	} else { //command === 'build'
		return {
			plugins: [react(), tailwindcss()],
			resolve: {
				alias: {
					"@": path.resolve(__dirname, "./src"),
				},
			},
		}
	}
})