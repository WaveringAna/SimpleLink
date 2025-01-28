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

export interface ClickStats {
	date: string;
	clicks: number;
}

export interface SourceStats {
	source: string;
	count: number;
}

export interface RegisterRequest {
	email: string;
	password: string;
	admin_token: string;
}