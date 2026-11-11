const avatarModules = import.meta.glob(
  '../assets/images/avatars/*.{png,jpg,jpeg,gif,svg,webp}',
  { eager: true, import: 'default' }
) as Record<string, string>;

export const AVATAR_LIST: string[] = Object.values(avatarModules);

export function resolveAvatar(avatarStr?: string): string {
  if (!avatarStr) return AVATAR_LIST[0] || '';

  if (
    avatarStr.startsWith('http') ||
    avatarStr.startsWith('data:') ||
    AVATAR_LIST.includes(avatarStr)
  ) {
    return avatarStr;
  }

  const fileName = avatarStr.split('/').pop()?.toLowerCase() || '';
  for (const [path, resolvedUrl] of Object.entries(avatarModules)) {
    if (path.toLowerCase().endsWith(fileName)) {
      return resolvedUrl;
    }
  }

  return AVATAR_LIST[0] || avatarStr;
}