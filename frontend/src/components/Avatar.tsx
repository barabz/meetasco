import type { User } from '../types';

interface Props {
  user: User | null;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 24, md: 32, lg: 40 };

export default function Avatar({ user, size = 'md' }: Props) {
  const px = sizes[size];
  if (!user) return null;
  const initials = user.full_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: user.avatar_color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: px * 0.38,
        fontWeight: 700,
        color: '#fff',
        flexShrink: 0,
        userSelect: 'none',
      }}
      title={user.full_name}
    >
      {initials}
    </div>
  );
}
