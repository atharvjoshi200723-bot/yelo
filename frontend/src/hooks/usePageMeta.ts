import { useEffect } from 'react';

interface PageMeta {
  title: string;
  description: string;
}

const SITE_NAME = 'YELO';
const DEFAULT_DESCRIPTION = 'YELO is a hyper-local marketplace and community where you can rent things, discover people nearby, and connect with local communities.';

const PAGE_META: Record<string, PageMeta> = {
  '/': {
    title: 'YELO — What\'s Around You',
    description: 'Discover things, people, and activities happening around you in Dehradun. Rent items, find buddies, and join local communities on YELO.',
  },
  '/rent': {
    title: 'Rent Locally — YELO',
    description: 'Find items available for rent near you in Dehradun. Cameras, bikes, projectors, and more — rent from people in your community.',
  },
  '/buddy': {
    title: 'Find a Buddy Nearby — YELO',
    description: 'Discover people nearby for coffee, movies, walks, study sessions, and more. Social companionship in your local community.',
  },
  '/forums': {
    title: 'Local Communities & Forums — YELO',
    description: 'Join college and community forums. Discuss academics, campus life, events, and everything happening around you.',
  },
  '/messages': {
    title: 'Messages — YELO',
    description: 'Your conversations on YELO.',
  },
  '/login': {
    title: 'Sign In — YELO',
    description: 'Sign in to YELO — your hyper-local marketplace and social community.',
  },
  '/register': {
    title: 'Join YELO',
    description: 'Create your YELO account and start discovering things and people in your local community.',
  },
  '/profile': {
    title: 'My Profile — YELO',
    description: 'Manage your YELO profile, settings, and verification status.',
  },
  '/admin': {
    title: 'Admin Dashboard — YELO',
    description: 'YELO administration panel.',
  },
  '/privacy': {
    title: 'Privacy Policy — YELO',
    description: 'Learn how YELO collects, uses, and protects your information.',
  },
  '/terms': {
    title: 'Terms of Service — YELO',
    description: 'Terms governing your use of the YELO platform.',
  },
  '/community-guidelines': {
    title: 'Community Guidelines — YELO',
    description: 'Guidelines for respectful, safe behavior on YELO.',
  },
  '/rental-guidelines': {
    title: 'Rental Guidelines — YELO',
    description: 'Tips for safe, successful rentals on YELO.',
  },
};

function getPageMeta(pathname: string): PageMeta {
  // Exact match first
  if (PAGE_META[pathname]) return PAGE_META[pathname];

  // Prefix matching for dynamic routes
  if (pathname.startsWith('/rent/')) {
    return { title: 'Rent Item — YELO', description: 'View rental listing details on YELO.' };
  }
  if (pathname.startsWith('/buddy/become')) {
    return { title: 'Become a Buddy — YELO', description: 'Create your buddy profile and let others find you on YELO.' };
  }
  if (pathname.startsWith('/buddy/manage')) {
    return { title: 'My Buddy Profile — YELO', description: 'Manage your buddy profile on YELO.' };
  }
  if (pathname.startsWith('/buddy/')) {
    return { title: 'Buddy Profile — YELO', description: 'View buddy profile on YELO.' };
  }
  if (pathname.startsWith('/forums/post/')) {
    return { title: 'Forum Post — YELO', description: 'View forum discussion on YELO.' };
  }
  if (pathname.startsWith('/forums/')) {
    return { title: 'Forum Category — YELO', description: 'Browse forum category on YELO.' };
  }
  if (pathname.startsWith('/profile/')) {
    return { title: 'User Profile — YELO', description: 'View user profile on YELO.' };
  }
  if (pathname === '/profile/settings') {
    return { title: 'Profile Settings — YELO', description: 'Manage your YELO profile settings, verification, and account.' };
  }

  // 404 pages — the NotFoundPage component also sets this in its useEffect
  return { title: `Page Not Found — ${SITE_NAME}`, description: 'The page you are looking for does not exist on YELO.' };
}

export function usePageMeta() {
  useEffect(() => {
    const meta = getPageMeta(window.location.pathname);
    document.title = meta.title;

    let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.setAttribute('name', 'description');
      document.head.appendChild(descTag);
    }
    descTag.setAttribute('content', meta.description);

    let ogTitle = document.querySelector('meta[property="og:title"]') as HTMLMetaElement | null;
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', meta.title);

    let ogDesc = document.querySelector('meta[property="og:description"]') as HTMLMetaElement | null;
    if (!ogDesc) {
      ogDesc = document.createElement('meta');
      ogDesc.setAttribute('property', 'og:description');
      document.head.appendChild(ogDesc);
    }
    ogDesc.setAttribute('content', meta.description);
  }, [window.location.pathname]);
}
