export type SocialPlatform   = 'FACEBOOK' | 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE';
export type MemberRole       = 'OWNER' | 'ADMIN' | 'WAITER' | 'CHEF';
export type InvitationStatus = 'PENDING' | 'ACCEPTED';

export interface SocialLink {
  platform: SocialPlatform;
  handle:   string;
}

export interface MemberUser {
  id:        string;
  name:      string | null;
  email:     string;
  avatarUrl: string | null;
}

export interface RestaurantMember {
  id:       string;
  role:     MemberRole;
  isActive: boolean;
  user:     MemberUser;
}

export interface PendingInvitation {
  id:        string;
  email:     string;
  role:      MemberRole;
  createdAt: string;
  invitedBy: MemberUser;
}

export interface MembersResponse {
  members:     RestaurantMember[];
  invitations: PendingInvitation[];
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
  owner:       MemberUser;
  socialLinks: SocialLink[];
  members:     RestaurantMember[];
  createdAt:   string;
  updatedAt:   string;
}

export interface SignedUploadParams {
  signature: string;
  timestamp: number;
  apiKey:    string;
  cloudName: string;
  publicId:  string;
}

export interface CreateRestaurantDto {
  name:         string;
  slug:         string;
  description?: string;
  address?:     string;
  phone?:       string;
  whatsapp?:    string;
  schedule?:    string;
  socialLinks?: SocialLink[];
}

export type UpdateRestaurantDto = Partial<CreateRestaurantDto>;

export interface InviteMemberDto {
  email: string;
  role:  MemberRole;
}

export interface UpdateMemberDto {
  role?:     MemberRole;
  isActive?: boolean;
}
