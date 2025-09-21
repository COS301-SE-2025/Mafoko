import { SectionProps } from '../types.ts';

export const WorkspaceContent: SectionProps[] = [
  {
    id: 'groups',
    title: 'Managing Groups',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Groups help you organize saved terms. You can create new groups,
          rename them, or delete groups you no longer need.
        </p>
        <ol className="list-decimal list-inside space-y-2 mt-1">
          <li>
            <strong>Create a Group:</strong> Click the <em>New Group</em>{' '}
            button, enter a name, select terms, and confirm by clicking{' '}
            <em>Add Terms</em>.
          </li>
          <li>
            <strong>Rename a Group:</strong> Click the <em>pencil icon</em> next
            to the group name, update the name, and confirm by clicking
            <em> Rename Group</em>.
          </li>
          <li>
            <strong>Delete a Group:</strong> Click the{' '}
            <em>delete group icon</em>, select the groups you want to remove,
            and confirm the action.
          </li>
        </ol>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'move-terms',
    title: 'Moving Terms Between Groups',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          To move a term to a different group, click the <em>move icon</em> next
          to the term and select the new group from your list.
        </p>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'notes',
    title: 'Using Notes',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>
          Notes let you add extra context to saved terms. You can create, edit,
          or delete notes directly in the Workspace.
        </p>
        <ol className="list-decimal list-inside space-y-2 mt-1">
          <li>
            <strong>Add a Note:</strong> Click the <em>note icon</em> next to a
            term, type your note, and click <em>Save</em>.
          </li>
          <li>
            <strong>Edit a Note:</strong> Click the <em>pencil icon</em>, update
            the text, and confirm by clicking <em>Save</em>.
          </li>
          <li>
            <strong>Delete a Note:</strong> Use the delete option to remove
            notes you no longer need.
          </li>
        </ol>
      </div>
    ),
    assetLocation: '',
  },
  {
    id: 'delete-items',
    title: 'Deleting Terms and Glossaries',
    content: (
      <div className="space-y-6 leading-relaxed text-base">
        <p>You can remove items from your Workspace at any time:</p>
        <ol className="list-decimal list-inside">
          <li>
            <strong>Delete a Term:</strong> Go to <em>Saved Terms</em>, click
            the
            <em> delete icon</em>, and confirm.
          </li>
          <li>
            <strong>Delete a Glossary:</strong> Go to <em>Saved Glossaries</em>,
            click the remove option, and confirm.
          </li>
        </ol>
      </div>
    ),
    assetLocation: '',
  },
];
