import { useTranslation } from 'react-i18next';

export function TermsAndConditionsPage() {
  const { t } = useTranslation();

  return (
    <div className=" fixed inset-0 z-[9989] !bg-[var(--bg-tir)] flex items-center justify-center">
      {/* Main content area */}
      <main
        className={`flex-1 relative z-[2] box-border overflow-y-auto h-screen !bg-[var(--bg-first)]`}
      >
        <section className="terms-and-conditions max-w-4xl mx-auto px-4 sm:px-6 py-10 text-[var(--text-theme)] leading-relaxed text-left bg-white mt-20 ">
          <h2 className="!text-3xl font-bold mb-4 text-primary">
            {t('termsAndConditions.title')}
          </h2>

          <p className="text-lg mb-6">{t('termsAndConditions.welcome')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-3">
            1. {t('termsAndConditions.purposeTitle')}
          </h2>
          <p>{t('termsAndConditions.purpose')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-3">
            2. {t('termsAndConditions.userTitle')}
          </h2>
          <p>{t('termsAndConditions.user')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-3">
            3. {t('termsAndConditions.contributionTitle')}
          </h2>
          <p>{t('termsAndConditions.contribution')}</p>
          <p className="mt-3">{t('termsAndConditions.contribution2')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-3">
            4. {t('termsAndConditions.linguistTitle')}
          </h2>
          <p>{t('termsAndConditions.linguist')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-3">
            5. {t('termsAndConditions.propertyTitle')}
          </h2>
          <p>{t('termsAndConditions.property')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-3">
            6. {t('termsAndConditions.accuracyTitle')}
          </h2>
          <p>{t('termsAndConditions.accuracy')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-3">
            7. {t('termsAndConditions.commercialTitle')}
          </h2>
          <p>{t('termsAndConditions.commercial')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-3">
            8. {t('termsAndConditions.privaryTitle')}
          </h2>
          <p>{t('termsAndConditions.privacy')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-3">
            9. {t('termsAndConditions.changeTitle')}
          </h2>
          <p>{t('termsAndConditions.change')}</p>

          <h2 className="text-2xl font-semibold mt-8 mb-3">
            10. {t('termsAndConditions.contactTitle')}
          </h2>
          <p>{t('termsAndConditions.contact')}</p>
          <p className="mt-2">
            <strong>{t('termsAndConditions.email')}:</strong>{' '}
            <a
              href="mailto:dsfsi@up.ac.za"
              className="!text-[#00ceaf] underline"
            >
              dsfsi@up.ac.za
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}
