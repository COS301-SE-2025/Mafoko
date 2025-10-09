import { SectionProps } from '../types.ts';

export const SettingsContent: SectionProps[] = [
  {
    id: 'modes',
    title: 'Switching Between Light and Dark Mode',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Marito lets you quickly toggle between <strong>light mode</strong> and{' '}
          <strong>dark mode</strong> to match your visual preference and
          environment. This feature is available on every page and updates the
          interface instantly without disrupting your workflow.
        </p>

        <ol className="list-decimal list-inside space-y-2 mt-4">
          <li>
            <strong>Find the Toggle:</strong> Look for the sun/moon icon at the
            bottom-left corner of the sidebar.
          </li>
          <li>
            <strong>Switch Modes:</strong> Click the icon to instantly change
            between Light and Dark Mode.
          </li>
        </ol>
      </div>
    ),
    assetLocation: '/Mafoko/videos/settings/mode-change.mp4',
  },
  {
    id: 'profile-update',
    title: 'Updating Your Profile',
    content: (
      <div>
        <p>
          You can update your <strong>name</strong>, <strong>email</strong>,{' '} or <strong>password</strong> at any time from your profile settings. Each change requires confirmation for security purposes.
        </p>

        <ol className="list-decimal list-inside space-y-2 mt-4">
          <li>
            <strong>Update Name:</strong> Click <em>Edit Name</em>, enter your
            new name, confirm with your password, and click <em>Save</em>.
          </li>
          <li>
            <strong>Update Email:</strong> Click <em>Edit Email</em>, provide
            your new address, confirm with your password, and click{' '}
            <em>Save</em>.
          </li>
          <li>
            <strong>Update Password:</strong> Click <em>Edit Password</em>, type
            your new password, confirm it, and click <em>Save</em>.
          </li>
        </ol>
      </div>
    ),
    assetLocation: '/Mafoko/videos/settings/update-name.mp4',
  },
  {
    id: 'accessibility',
    title: 'Accessibility Settings',
    content: (
      <div>
        <p>
          Marito provides a range of accessibility options so you can tailor the
          app to your needs. You can adjust the <strong>language</strong>,
          <strong> text size</strong>, <strong>spacing</strong>, and
          <strong> colour contrast</strong> directly from the settings menu.
        </p>

        <ol className="list-decimal list-inside space-y-2 mt-4">
          <li>
            <strong>Change App Language:</strong> Open the language drop-down
            and select your preferred language.
          </li>
          <li>
            <strong>Enable High Contrast Mode:</strong> Click the
            <em> High Contrast toggle</em> to switch to a high-contrast colour
            scheme.
          </li>
        </ol>
      </div>
    ),
    assetLocation: '/Mafoko/videos/settings/accessibility.mp4',
  },
];
