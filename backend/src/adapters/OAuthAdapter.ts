export interface OAuthUserProfile {
  provider: 'Google' | 'Apple';
  id: string;
  email: string;
  name: string;
}

export class OAuthAdapter {
  public async verifyGoogleToken(token: string): Promise<OAuthUserProfile> {
    return {
      provider: 'Google',
      id: `google_uid_${Math.random().toString(36).substring(2, 10)}`,
      email: token.includes('@') ? token : 'google.user@example.com',
      name: 'Google Verified User',
    };
  }

  public async verifyAppleToken(token: string): Promise<OAuthUserProfile> {
    return {
      provider: 'Apple',
      id: `apple_uid_${Math.random().toString(36).substring(2, 10)}`,
      email: token.includes('@') ? token : 'apple.user@example.com',
      name: 'Apple Verified User',
    };
  }
}
