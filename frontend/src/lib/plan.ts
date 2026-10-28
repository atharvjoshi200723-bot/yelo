import { SocialPost } from '../types';

export type PlanDetails = {
  title: string;
  description: string;
  details: { icon: string; label: string }[];
};

// A Linkup plan stores its title separately and packs the date and participant
// rows into the content string. Split those back apart so views render it as a
// structured plan — title, description, symbol rows — instead of one blob.
export function parsePlanPost(post: SocialPost): PlanDetails | null {
  if (!post.title?.trim()) return null;
  const details: { icon: string; label: string }[] = [];
  const description: string[] = [];
  for (const raw of post.content.split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^(\S+)\s+(.*)$/);
    if (match && !/^[A-Za-z0-9]/.test(line)) {
      details.push({ icon: match[1], label: match[2] });
    } else {
      description.push(line);
    }
  }
  return { title: post.title.trim(), description: description.join('\n'), details };
}

// "3/4" style occupancy label. Empty string when the post is not a plan.
export function participantRatio(post: Pick<SocialPost, 'participants_count' | 'max_participants'>): string {
  if (post.max_participants == null) return '';
  return `${post.participants_count ?? 0}/${post.max_participants}`;
}
