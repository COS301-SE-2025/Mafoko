import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Settings,
  Trophy,
  Briefcase,
  Book,
  Search,
  BookOpen,
  HelpCircle,
  MessageSquare,
  BarChart3,
  Shield,
  House,
  BadgeCheck,
  Plus,
} from 'lucide-react';

export const useAppMenu = (userRole: string) => {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        id: 'main-navigation',
        label: t('navbar.mainNavigation'),
        items: [
          {
            id: 'dashboard',
            label: t('navigation.home'),
            path: '/dashboard',
            icon: House,
          },
          {
            id: 'analytics',
            label: t('navbar.analytics'),
            path: '/analytics',
            icon: BarChart3,
          },
        ],
      },
      {
        id: 'workspace-tools',
        label: t('navbar.workspaceAndTools'),
        items: [
          // Workspace - only for authenticated users (not guests)
          ...(userRole !== 'guest'
            ? [
                {
                  id: 'workspace',
                  label: t('navbar.workspace'),
                  path: '/workspace',
                  icon: Briefcase,
                },
              ]
            : []),
          {
            id: 'glossary',
            label: t('navigation.glossary'),
            path: '/glossary',
            icon: Book,
          },
          {
            id: 'search',
            label: t('navigation.dictionary'),
            path: '/search',
            icon: Search,
          },
          // Learning path - only for authenticated users (not guests)
          ...(userRole !== 'guest'
            ? [
                {
                  id: 'learning-path',
                  label: t('navbar.learing'),
                  path: '/learning-path',
                  icon: BookOpen,
                },
              ]
            : []),
          {
            id: 'contributor-page',
            label: t('navbar.termAddition'),
            path: '/contributor',
            icon: Plus,
          },
          ...(userRole === 'admin'
            ? [
                {
                  id: 'admin-page',
                  label: t('navbar.admin'),
                  path: '/admin/terms',
                  icon: Shield,
                },
                {
                  id: 'linguist-page',
                  label: t('navbar.linguist'),
                  path: '/linguist',
                  icon: BadgeCheck,
                },
              ]
            : []),
        ],
      },
      // Profile and Account - only for authenticated users (not guests)
      ...(userRole !== 'guest'
        ? [
            {
              id: 'profile-account',
              label: t('navbar.profileAndAccount'),
              items: [
                {
                  id: 'settings',
                  label: t('settings.title'),
                  path: '/settings',
                  icon: Settings,
                },
                {
                  id: 'achievements',
                  label: t('navbar.achievements'),
                  path: '/achievements',
                  icon: Trophy,
                },
              ],
            },
          ]
        : []),
      {
        id: 'support-feedback',
        label: t('navbar.supportAndFeedback'),
        items: [
          {
            id: 'help',
            label: t('navigation.help'),
            path: '/help',
            icon: HelpCircle,
          },
          {
            id: 'feedback',
            label: t('navbar.feedback'),
            path: '/feedback',
            icon: MessageSquare,
          },
        ],
      },
    ],
    [t, userRole],
  );
};
