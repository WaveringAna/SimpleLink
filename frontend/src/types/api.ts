export interface CreateLinkRequest {
	url: string;
	custom_code?: string;
	source?: string;
}

export interface Link {
	id: number;
	original_url: string;
	short_code: string;
	created_at: string;
	clicks: number;
}

export interface User {
	id: number;
	email: string;
}

export interface AuthResponse {
	token: string;
	user: User;
}

export interface ApiError {
	error: string;
}