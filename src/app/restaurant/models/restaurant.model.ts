export type SocialPlatform = 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE';
export type MemberRole    = 'OWNER' | 'ADMIN' | 'WAITER' | 'CHEF';

export interface SocialLink {
  platform: SocialPlatform;
  handle:   string;
}

export interface RestaurantMember {
  role: MemberRole;
  user: { id: string; name: string | null; email: string };
}

export interface Restaurant {
  id:          string;
  name:        string;
  slug:        string;
  description: string | null;
  logoUrl:     string | null;
  address:     string | null;
  phone:       string | null;
  whatsapp:    string | null;
  schedule:    string | null;
  isActive:    boolean;
  ownerId:     string;
  owner:       { id: string; name: string | null; email: string };
  socialLinks: SocialLink[];
  members:     RestaurantMember[];
  createdAt:   string;
  updatedAt:   string;
}

export interface CreateRestaurantDto {
  name:        string;
  slug:        string;
  description?: string;
  address?:    string;
  phone?:      string;
  whatsapp?:   string;
  schedule?:   string;
  socialLinks?: SocialLink[];
}

export type UpdateRestaurantDto = Partial<CreateRestaurantDto>;
