import axios from 'axios';
import { CreateLinkRequest, Link, AuthResponse, ClickStats, SourceStats } from '../types/api';

// Create axios instance with default config
const api = axios.create({
	baseURL: '/api',
});

// Add a request interceptor to add the auth token to all requests
api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token');
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

// Auth endpoints
export const login = async (email: string, password: string) => {
	const response = await api.post<AuthResponse>('/auth/login', {
		email,
		password,
	});
	return response.data;
};

export const register = async (email: string, password: string, adminToken: string) => {
	const response = await api.post<AuthResponse>('/auth/register', {
		email,
		password,
		admin_token: adminToken,
	});
	return response.data;
};

// Protected endpoints
export const createShortLink = async (data: CreateLinkRequest) => {
	const response = await api.post<Link>('/shorten', data);
	return response.data;
};

export const getAllLinks = async () => {
	const response = await api.get<Link[]>('/links');
	return response.data;
};

export const deleteLink = async (id: number) => {
	await api.delete(`/links/${id}`);
};

export const getLinkClickStats = async (id: number) => {
	const response = await api.get<ClickStats[]>(`/links/${id}/clicks`);
	return response.data;
};

export const getLinkSourceStats = async (id: number) => {
	const response = await api.get<SourceStats[]>(`/links/${id}/sources`);
	return response.data;
};

export { api };