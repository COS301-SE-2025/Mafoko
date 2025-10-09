import React, { useState, useEffect, useRef } from 'react';
import LeftNav from '../components/ui/LeftNav';
import Navbar from '../components/ui/Navbar';
import { useDarkMode } from '../components/ui/DarkModeComponent';
import {
  GamificationService,
  UserLevel,
  UserAchievement,
  LoginStreak,
  WeeklyGoal,
} from '../utils/gamification';
import '../styles/Global.scss';
import '../styles/GamificationPage.scss';
import { Star } from 'lucide-react';
import { ContributionGraph } from '../components/ui/ContributionGraph.tsx';
import { useTranslation } from 'react-i18next';

interface UserData {
  uuid?: string;
  id?: string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  email?: string;
}

interface GamificationState {
  userLevel: UserLevel | null;
  achievements: UserAchievement[] | null;
  loginStreak: LoginStreak | null;
  weeklyGoals: WeeklyGoal[] | null;
  loading: boolean;
  error: string | null;
}

const getAchievementIconClass = (achievementKey: string): string => {
  switch (achievementKey) {
    case 'term_pioneer':
      return 'achievement-1';
    case 'community_contributor':
      return 'achievement-2';
    case 'crowd_favorite':
      return 'achievement-3';
    case 'multilingual_master':
      return 'achievement-4';
    case 'consistency_champion':
      return 'achievement-1';
    case 'language_guardian':
      return 'achievement-2';
    default:
      return 'achievement-1';
  }
};

const normalizeAchievementKey = (name: string): string => {
  const mapping: Record<string, string> = {
    'Term Pioneer': 'term_pioneer',
    'Community Contributor': 'community_contributor',
    'Crowd Favorite': 'crowd_favorite',
    'Multilingual Master': 'multilingual_master',
    'Consistency Champion': 'consistency_champion',
    'Language Guardian': 'language_guardian',
  };
  return mapping[name] || 'term_pioneer';
};

const getAchievementIconPath = (
  achievementName: string,
): React.ReactElement => {
  switch (achievementName) {
    case 'term_pioneer':
      return (
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      );
    case 'community_contributor':
      return (
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
      );
    case 'crowd_favorite':
      return (
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      );
    case 'multilingual_master':
      return (
        <path d="M17.63 5.84C17.27 5.33 16.67 5 16 5L5 5.01C3.9 5.01 3 5.9 3 7v10c0 1.1.9 1.99 2 1.99L16 19c.67 0 1.27-.33 1.63-.84L21 12l-3.37-6.16z" />
      );
    case 'consistency_champion':
      return (
        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.59 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
      );
    case 'language_guardian':
      return (
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
      );
    default:
      return (
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
      );
  }
};

const GamificationPage: React.FC = () => {
  const { t } = useTranslation();

  const ACHIEVEMENT_DEFINITIONS = [
    {
      id: 1,
      key: 'term_pioneer',
      title: t('achievements.termPioneer.title'),
      description: t('achievements.termPioneer.desc'),
      category: 'achievement-1',
    },
    {
      id: 2,
      key: 'community_contributor',
      title: t('achievements.communityContributor.title'),
      description: t('achievements.communityContributor.desc'),
      category: 'achievement-2',
    },
    {
      id: 3,
      key: 'crowd_favorite',
      title: t('achievements.crowdFavorite.title'),
      description: t('achievements.crowdFavorite.desc'),
      category: 'achievement-3',
    },
    {
      id: 4,
      key: 'multilingual_master',
      title: t('achievements.multilingualMaster.title'),
      description: t('achievements.multilingualMaster.desc'),
      category: 'achievement-4',
    },
    {
      id: 5,
      key: 'consistency_champion',
      title: t('achievements.consistencyChampion.title'),
      description: t('achievements.consistencyChampion.desc'),
      category: 'achievement-1',
    },
    {
      id: 6,
      key: 'language_guardian',
      title: t('achievements.languageGuardian.title'),
      description: t('achievements.languageGuardian.desc'),
      category: 'achievement-2',
    },
  ];

  const [user] = useState<UserData>(() => {
    try {
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        return JSON.parse(storedUserData) as UserData;
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      /* empty */
    }

    return {
      userId: 'mock-user-id',
      firstName: 'John',
      lastName: 'Mavito',
      email: 'john.mavito@example.com',
    };
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const { isDarkMode } = useDarkMode();
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [gamificationState, setGamificationState] = useState<GamificationState>(
    {
      userLevel: null,
      achievements: null,
      loginStreak: null,
      weeklyGoals: null,
      loading: true,
      error: null,
    },
  );

  // Profile picture hook removed - always showing initials now

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  };

  const getFullName = (firstName: string, lastName: string) => {
    return `${firstName} ${lastName}`;
  };

  useEffect(() => {
    const loadGamificationData = async () => {
      if (user.id === 'mock-user-id') {
        console.log('Mock user detected, skipping real API calls');
        setGamificationState((prev) => ({ ...prev, loading: false }));
        return;
      }

      setGamificationState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        const [userLevel, achievements, loginStreak, weeklyGoals] =
          await Promise.all([
            GamificationService.getUserLevel(user.id || ''),
            GamificationService.getUserAchievements(user.id || ''),
            GamificationService.getUserLoginStreak(user.id || ''),
            GamificationService.getUserWeeklyGoals(user.id || ''),
          ]);

        setGamificationState({
          userLevel,
          achievements,
          loginStreak,
          weeklyGoals,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error('Error loading gamification data:', error);
        setGamificationState((prev) => ({
          ...prev,
          loading: false,
          error: 'Failed to load gamification data',
        }));
      }
    };

    void loadGamificationData();
  }, [user]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;

    const styleId = 'gamification-scroll-fix';
    let injectedStyle = document.getElementById(
      styleId,
    ) as HTMLStyleElement | null;
    if (!injectedStyle) {
      injectedStyle = document.createElement('style');
      injectedStyle.id = styleId;
      injectedStyle.innerHTML = `html, body, #root { overflow-y: auto !important; height: auto !important; }`;
      document.head.appendChild(injectedStyle);
    }

    html.style.overflow = 'auto';
    body.style.overflow = 'auto';

    const t = setTimeout(() => {
      if (containerRef.current) {
        containerRef.current.scrollIntoView({
          behavior: 'auto',
          block: 'start',
        });
      }
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, 30);

    return () => {
      clearTimeout(t);
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      if (injectedStyle.parentElement) {
        injectedStyle.parentElement.removeChild(injectedStyle);
      }
    };
  }, []);

  return (
    <div
      className={`gamification-fixed-background ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
    >
      {isMobile ? (
        <Navbar />
      ) : (
        <LeftNav activeItem="achievements" setActiveItem={() => {}} />
      )}
      <div
        className="gamification-page"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '0',
          margin: '0',
          width: '100%',
        }}
      >
        <div className="container text-theme" ref={containerRef}>
          <div className="profile-section bg-theme text-theme">
            <div className="profile-header">
              <div className="avatar">
                {getUserInitials(
                  user.firstName || user.first_name || '',
                  user.lastName || user.last_name || '',
                )}
              </div>
              <div className="user-info">
                <div className="username">
                  {getFullName(
                    user.firstName || user.first_name || '',
                    user.lastName || user.last_name || '',
                  )}
                </div>
                <div className="level-badge">
                  {gamificationState.loading
                    ? `${t('achievements.loading', 'Loading')}...`
                    : gamificationState.userLevel
                      ? `${t('achievements.level', 'Level')} ${String(gamificationState.userLevel.current_level)}`
                      : `${t('achievements.level', 'Level')} 1`}
                </div>
              </div>
            </div>
            <div className="xp-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      gamificationState.userLevel
                        ? String(
                            (gamificationState.userLevel.xp_progress_in_level /
                              gamificationState.userLevel.xp_for_next_level) *
                              100,
                          )
                        : '0'
                    }%`,
                  }}
                ></div>
              </div>
              <div className="progress-text">
                <span>
                  {gamificationState.loading
                    ? 'Loading...'
                    : gamificationState.userLevel
                      ? `${gamificationState.userLevel.xp_progress_in_level.toLocaleString()} XP`
                      : '0 XP'}
                </span>
                <span>
                  {gamificationState.loading
                    ? ''
                    : gamificationState.userLevel
                      ? `${(gamificationState.userLevel.xp_for_next_level - gamificationState.userLevel.xp_progress_in_level).toLocaleString()} XP ${t('learningPathPage.main.toNextLevel')}`
                      : `100 XP ${t('learningPathPage.main.toNextLevel')}`}
                </span>
              </div>
            </div>
            <div
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-5"
              style={{ marginTop: '20px' }}
            >
              <div className="stat-card">
                <div className="stat-value">
                  {gamificationState.loading
                    ? '...'
                    : gamificationState.userLevel
                      ? gamificationState.userLevel.total_xp.toLocaleString()
                      : '0'}
                </div>
                <div className="stat-label">{t('achievements.totalXP')}</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {gamificationState.loading
                    ? '...'
                    : gamificationState.loginStreak
                      ? gamificationState.loginStreak.current_streak
                      : '0'}
                </div>
                <div className="stat-label">
                  {t('achievements.currentStreak')}
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {gamificationState.loading
                    ? '...'
                    : gamificationState.achievements
                      ? gamificationState.achievements.filter(
                          (a) => a.is_earned,
                        ).length
                      : '0'}
                </div>
                <div className="stat-label">
                  {t('achievements.achievementsLabel')}
                </div>
              </div>
            </div>
          </div>

          <div
            className="bg-theme h-80 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex flex-col p-10 mb-10 gap-4"
            style={{ padding: '20px', marginBottom: '30px' }}
          >
            <div className="p-3 flex gap-3">
              <Star className="text-teal-500" />
              <p className="section-title">
                {t('achievements.contributionActivity')}
              </p>
            </div>
            <div>
              <ContributionGraph user={user} />
            </div>
            {!isMobile && (
              <div className="flex gap-5 flex-row-reverse">
                <div
                  className="flex gap-2 text-center pt-3  items-center"
                  style={{ marginTop: '5px' }}
                >
                  <div className={`w-4 h-4 rounded-xs bg-slate-900`}></div>
                  <div className="text-center">100+ XP</div>
                </div>
                <div
                  className="flex gap-2 text-center pt-3  items-center"
                  style={{ marginTop: '5px' }}
                >
                  <div className={`w-4 h-4 rounded-xs bg-pink-600`}></div>
                  <div className="text-center">31-100 XP</div>
                </div>
                <div
                  className="flex gap-2 text-center pt-3  items-center"
                  style={{ marginTop: '5px' }}
                >
                  <div className={`w-4 h-4 rounded-xs bg-yellow-300`}></div>
                  <div className="text-center">11-30 XP</div>
                </div>
                <div
                  className="flex gap-2 text-center pt-3  items-center"
                  style={{ marginTop: '5px' }}
                >
                  <div className={`w-4 h-4 rounded-xs bg-teal-200`}></div>
                  <div className="text-center">1-10 XP</div>
                </div>
                <div
                  className="flex gap-2 text-center pt-3 items-center"
                  style={{ marginTop: '5px' }}
                >
                  <div className={`w-4 h-4 rounded-xs bg-gray-200`}></div>
                  <div className="text-center">
                    {t('achievements.noActivity')}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="xp-guide-section bg-theme text-theme">
            <div className="section-title">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="var(--teal)"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 16C12.4183 16 16 12.4183 16 8C16 3.58172 12.4183 0 8 0C3.58172 0 0 3.58172 0 8C0 12.4183 3.58172 16 8 16Z"
                  fill="var(--teal)"
                />
                <path
                  d="M8 12C10.2091 12 12 10.2091 12 8C12 5.79086 10.2091 4 8 4C5.79086 4 4 5.79086 4 8C4 10.2091 5.79086 12 8 12Z"
                  fill="white"
                />
                <path
                  d="M8 10C9.10457 10 10 9.10457 10 8C10 6.89543 9.10457 6 8 6C6.89543 6 6 6.89543 6 8C6 9.10457 6.89543 10 8 10Z"
                  fill="var(--teal)"
                />
              </svg>
              {t('achievements.howToEarnXP')}
            </div>

            <div className="xp-guide-grid">
              <div className="xp-guide-item">
                <div
                  className="xp-guide-icon"
                  style={{
                    backgroundColor: 'rgba(0, 206, 175, 0.1)',
                    color: 'var(--teal)',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                  </svg>
                </div>
                <div className="xp-guide-info">
                  <div className="xp-guide-action">
                    {t('achievements.addTerm')}
                  </div>
                  <div className="xp-guide-value">+100 XP</div>
                </div>
              </div>

              <div className="xp-guide-item">
                <div
                  className="xp-guide-icon"
                  style={{
                    backgroundColor: 'rgba(240, 10, 80, 0.1)',
                    color: 'var(--pink)',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
                <div className="xp-guide-info">
                  <div className="xp-guide-action">
                    {t('achievements.addComment')}
                  </div>
                  <div className="xp-guide-value">+10 XP</div>
                </div>
              </div>

              <div className="xp-guide-item">
                <div
                  className="xp-guide-icon"
                  style={{
                    backgroundColor: 'rgba(242, 208, 1, 0.1)',
                    color: 'var(--yellow)',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                  </svg>
                </div>
                <div className="xp-guide-info">
                  <div className="xp-guide-action">
                    {t('achievements.receiveUpvote')}
                  </div>
                  <div className="xp-guide-value">
                    +5 XP {t('achievements.perUpvote')}
                  </div>
                </div>
              </div>

              <div className="xp-guide-item">
                <div
                  className="xp-guide-icon"
                  style={{
                    backgroundColor: 'rgba(33, 36, 49, 0.1)',
                    color: 'var(--dark-blue)',
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.58-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                  </svg>
                </div>
                <div className="xp-guide-info">
                  <div className="xp-guide-action">
                    {t('achievements.dailyLoginBonus')}
                  </div>
                  <div className="xp-guide-value">+5 XP</div>
                </div>
              </div>
            </div>
          </div>

          <div className="goals-section bg-theme">
            <div className="section-title">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="var(--teal)"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M14 2H2V14H14V2Z"
                  stroke="var(--teal)"
                  strokeWidth="1.5"
                  fill="none"
                />
                <path d="M4 4H12" stroke="var(--teal)" strokeWidth="1.5" />
                <path d="M4 8H12" stroke="var(--teal)" strokeWidth="1.5" />
                <path d="M4 12H12" stroke="var(--teal)" strokeWidth="1.5" />
                <path d="M6 2V4" stroke="var(--teal)" strokeWidth="1.5" />
                <path d="M10 2V4" stroke="var(--teal)" strokeWidth="1.5" />
              </svg>
              {t('achievements.weeklyGoals')}
            </div>

            <div className="goals-grid">
              {gamificationState.loading ? (
                <div>{t('achievements.loadingWeeklyGoals')}...</div>
              ) : gamificationState.weeklyGoals &&
                gamificationState.weeklyGoals.length > 0 ? (
                gamificationState.weeklyGoals.map((goal) => (
                  <div
                    key={goal.id}
                    className={`goal-card ${goal.is_completed ? 'completed' : ''}`}
                  >
                    <div className="goal-header">
                      <div className="goal-title">
                        {t(`weeklyGoals.${goal.name}`, goal.name)}
                      </div>

                      <div className="goal-xp">{goal.xp_reward} XP</div>
                    </div>
                    <div className="goal-desc text-left">
                      {t(`weeklyGoals.${goal.description}`, goal.description)}
                    </div>
                    <div className="goal-progress">
                      <div className="goal-progress-bar">
                        <div
                          className="goal-progress-fill"
                          style={{
                            width: `${String(goal.progress_percentage)}%`,
                          }}
                        ></div>
                      </div>
                      <div className="goal-status">
                        {goal.is_completed
                          ? `${t('achievements.completed')}!`
                          : `${String(goal.current_progress)} ${t('achievements.of')} ${String(goal.target_value)} ${t('achievements.completed')}`}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="goal-card">
                  <div className="goal-header">
                    <div className="goal-title">
                      {t('achievements.noGoals')}
                    </div>
                    <div className="goal-xp">--</div>
                  </div>
                  <div className="goal-progress">
                    <div className="goal-progress-bar">
                      <div
                        className="goal-progress-fill"
                        style={{ width: '0%' }}
                      ></div>
                    </div>
                    <div className="goal-status">
                      {t('achievements.checkBackNextWeek')}!
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="achievements-section">
            <div className="section-title">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="var(--teal)"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M8 0L10.122 5.467L16 5.878L11.755 9.533L12.938 15.322L8 12.5L3.062 15.322L4.245 9.533L0 5.878L5.878 5.467L8 0Z"
                  fill="var(--teal)"
                />
              </svg>
              {t('achievements.achievementsLabel')}
            </div>

            <div className="achievements-grid">
              {gamificationState.loading ? (
                <div>{t('achievements.loadingAchievements')}...</div>
              ) : gamificationState.achievements ? (
                gamificationState.achievements.map((achievement) => {
                  const achievementKey = normalizeAchievementKey(
                    achievement.name,
                  );

                  const isLocked = !achievement.is_earned;

                  return (
                    <div
                      key={achievement.id}
                      className={`achievement-card ${isLocked ? 'locked' : ''}`}
                    >
                      <div
                        className={`achievement-icon ${getAchievementIconClass(achievementKey)}`}
                      >
                        <svg
                          width="32"
                          height="32"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          {getAchievementIconPath(achievementKey)}
                        </svg>
                      </div>
                      <div className="achievement-title">
                        {t(`achievements.${achievementKey}.title`)}
                      </div>
                      <div className="achievement-desc">
                        {t(`achievements.${achievementKey}.desc`)}
                      </div>

                      {achievement.is_earned ? (
                        <div className="achievement-badge">
                          {t('achievements.unlocked')}
                        </div>
                      ) : (
                        <div className="achievement-progress">
                          <div className="achievement-progress-bar">
                            <div
                              className="achievement-progress-fill"
                              style={{
                                width: `${String(achievement.progress_percentage)}%`,
                              }}
                            ></div>
                          </div>
                          <div className="achievement-status">
                            {String(achievement.current_progress)}{' '}
                            {t('achievements.of')}{' '}
                            {String(achievement.target_value)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                ACHIEVEMENT_DEFINITIONS.map((achievement) => (
                  <div key={achievement.id} className="achievement-card locked">
                    <div className={`achievement-icon ${achievement.category}`}>
                      <svg
                        width="32"
                        height="32"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                    </div>
                    <div className="achievement-title">
                      {' '}
                      {t(`achievements.${achievement.key}.title`)}
                    </div>
                    <div className="achievement-desc">
                      {t(`achievements.${achievement.key}.desc`)}
                    </div>
                    <div className="achievement-progress">
                      <div className="achievement-progress-bar">
                        <div
                          className="achievement-progress-fill"
                          style={{ width: '0%' }}
                        ></div>
                      </div>
                      <div className="achievement-status">
                        0 {t('achievements.progress')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamificationPage;
