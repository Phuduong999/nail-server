export type Role = 'USER' | 'NAIL_ARTIST' | 'ADMIN';
export type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface UserPayload {
  id: number;
  email: string;
  role: Role;
}

export interface RegisterUserDto {
  email: string;
  password: string;
  role: Role;
}

export interface LoginUserDto {
  email: string;
  password: string;
}

export interface RegisterNailArtistDto {
  email: string;
  password: string;
  name: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
  images?: string;
}

export interface UpdateNailArtistDto {
  name?: string;
  phone?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  images?: string;
}

export interface CreateReviewDto {
  nailArtistId: number;
  rating: number;
  comment: string;
} 