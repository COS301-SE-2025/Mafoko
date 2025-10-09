import { Send, Loader, AlertCircle } from 'lucide-react';
import { FeedbackType } from '../../types/feedback';
import { useTranslation } from 'react-i18next';

interface FormData {
  name: string;
  email: string;
  message: string;
  type: FeedbackType;
}

interface Tab {
  id: FeedbackType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
}

interface FeedbackFormProps {
  formData: FormData;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  handleSubmit: (e: React.FormEvent) => void;
  activeTab: FeedbackType;
  activeTabData: Tab;
  isSubmitting?: boolean;
  submitError?: string | null;
}

const FeedbackForm = ({
  formData,
  handleInputChange,
  handleSubmit,
  activeTab,
  activeTabData,
  isSubmitting = false,
  submitError = null,
}: FeedbackFormProps) => {
  const { t } = useTranslation();

  return (
    <form onSubmit={handleSubmit} className="feedback-form">
      <div className="form-fields">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              {t('feedbackPage.name')}
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder={t('feedbackPage.namePlaceholder')}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email" className="form-label">
              {t('feedbackPage.email')}
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="form-input"
              placeholder={t('feedbackPage.emailPlaceholder')}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="message" className="form-label">
            {t('feedbackPage.your')} {activeTabData.label} *
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            value={formData.message}
            onChange={handleInputChange}
            className="form-textarea"
            placeholder={
              activeTab === FeedbackType.SUGGESTION
                ? `${t('feedbackPage.suggest')}...`
                : activeTab === FeedbackType.COMPLAINT
                  ? `${t('feedbackPage.issue')}...`
                  : `${t('feedbackPage.compliment')}...`
            }
          />
        </div>

        {submitError && (
          <div className="error-message">
            <AlertCircle className="error-icon" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="form-submit">
          <button
            type="submit"
            disabled={!formData.message.trim() || isSubmitting}
            className={`submit-button ${
              formData.message.trim() && !isSubmitting ? 'enabled' : 'disabled'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader className="submit-icon loading" />
                {t('feedbackPage.submiting')}...
              </>
            ) : (
              <>
                <Send className="submit-icon" />
                {t('feedbackPage.singluarSubmit')} {activeTabData.label}
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
};

export default FeedbackForm;
