import client from './client';

/**
 * 用户资料接口类型
 */
export interface UserProfile {
  username: string;
  email: string;
  avatarUrl: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  createdAt: string;
}

/**
 * 更新用户资料请求类型
 */
export interface UpdateUserProfileRequest {
  avatarUrl?: string;
  bio?: string;
  location?: string;
  website?: string;
}

/**
 * 获取当前用户资料
 */
export async function getMyProfile(): Promise<UserProfile> {
  const response = await client.get('/users/me');
  return response.data;
}

/**
 * 获取指定用户资料
 */
export async function getUserProfile(username: string): Promise<UserProfile> {
  const response = await client.get(`/users/${username}`);
  return response.data;
}

/**
 * 更新当前用户资料
 */
export async function updateProfile(data: UpdateUserProfileRequest): Promise<UserProfile> {
  const response = await client.put('/users/me/profile', data);
  return response.data;
}
