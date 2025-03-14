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

api.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			localStorage.removeItem('token');
			localStorage.removeItem('user');

			window.dispatchEvent(new Event('unauthorized'));
		}
		return Promise.reject(error);
	}
);


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

export const editLink = async (id: number, data: Partial<CreateLinkRequest>) => {
	const response = await api.patch<Link>(`/links/${id}`, data);
	return response.data;
};


export const deleteLink = async (id: number) => {
	await api.delete(`/links/${id}`);
};

export const getLinkClickStats = async (id: number) => {
	try {
		const response = await api.get<ClickStats[]>(`/links/${id}/clicks`);
		return response.data;
	} catch (error) {
		console.error('Error fetching click stats:', error);
		throw error;
	}
};

export const getLinkSourceStats = async (id: number) => {
	try {
		const response = await api.get<SourceStats[]>(`/links/${id}/sources`);
		return response.data;
	} catch (error) {
		console.error('Error fetching source stats:', error);
		throw error;
	}
};


export const checkFirstUser = async () => {
	const response = await api.get<{ isFirstUser: boolean }>('/auth/check-first-user');
	return response.data.isFirstUser;
};

export { api };