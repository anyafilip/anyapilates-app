import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['en', 'th'],
  defaultLocale: 'en',
  // Disable automatic locale detection based on the user's browser
  localeDetection: false,
});

export const { Link, redirect, usePathname, useRouter } = createNavigation(routing);
