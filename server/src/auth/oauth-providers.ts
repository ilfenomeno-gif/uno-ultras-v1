// ============================================================
// UNO ULTRA Server — OAuth Provider Configuration Registry
// ============================================================

export type OAuthProviderId = 'google' | 'discord';

export interface OAuthProviderConfig {
  readonly id: OAuthProviderId;
  readonly enabled: boolean;
  readonly clientId: string;
}

export function getConfiguredOAuthProviders(
  envSource: NodeJS.ProcessEnv = process.env,
): readonly OAuthProviderConfig[] {
  const googleClientId = envSource['OAUTH_GOOGLE_CLIENT_ID'] ?? '';
  const discordClientId = envSource['OAUTH_DISCORD_CLIENT_ID'] ?? '';

  return [
    {
      id: 'google',
      enabled: googleClientId.length > 0,
      clientId: googleClientId,
    },
    {
      id: 'discord',
      enabled: discordClientId.length > 0,
      clientId: discordClientId,
    },
  ];
}
