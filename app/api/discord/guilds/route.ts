import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const accessToken = session.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: 'No access token - please sign out and sign in again' }, { status: 403 });
  }

  const guildsResp = await fetch('https://discord.com/api/v10/users/@me/guilds', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!guildsResp.ok) {
    return NextResponse.json({ error: 'Failed to fetch guilds from Discord' }, { status: 502 });
  }

  const guilds = await guildsResp.json();

  // Filter to guilds where user has ADMINISTRATOR permission (0x8) or is owner
  const manageableGuilds = guilds.filter((g: any) => {
    const perms = BigInt(g.permissions);
    return (perms & BigInt(0x8)) !== BigInt(0) || g.owner;
  });

  const results = manageableGuilds.map((guild: any) => ({
    id: guild.id,
    name: guild.name,
    icon: guild.icon,
    owner: guild.owner,
  }));

  return NextResponse.json({ guilds: results });
}
