import axios from 'axios';
import { CreateLinkRequest, Link } from '../types/api';

const api = axios.create({
	baseURL: '/api',
});

export const createShortLink = async (data: CreateLinkRequest) => {
	const response = await api.post<Link>('/shorten', data);
	return response.data;
};

export const getAllLinks = async () => {
	const response = await api.get<Link[]>('/links');
	return response.data;
};

