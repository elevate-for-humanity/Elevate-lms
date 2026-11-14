export const MAIL_VIEWS = [
  'inbox',
  'sent',
  'starred',
  'archive',
  'spam',
  'trash',
  'all',
  'drafts',
] as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validateMailAction(body: any): string | null {
  if (!UUID.test(String(body.mailboxId || ''))) return 'A valid mailbox is required.';
  const allowed = [
    'move',
    'star',
    'read',
    'unread',
    'createFolder',
    'renameFolder',
    'deleteFolder',
    'saveDraft',
    'deleteDraft',
    'createFilter',
    'disableFilter',
  ];
  if (!allowed.includes(body.action)) return 'Unsupported email action.';
  if (body.action === 'createFilter') {
    if (
      !['sender', 'subject', 'body'].includes(body.field) ||
      !String(body.contains || '').trim() ||
      String(body.contains).length > 160 ||
      !['skip', 'folder', 'archive', 'spam'].includes(body.filterAction)
    )
      return 'Choose a valid match and filter action.';
    if (body.filterAction === 'folder' && !UUID.test(String(body.folderId || '')))
      return 'Choose a destination folder.';
  }
  if (body.action === 'disableFilter' && !UUID.test(String(body.filterId || '')))
    return 'A valid filter is required.';
  if (
    ['createFolder', 'renameFolder'].includes(body.action) &&
    (!String(body.name || '').trim() || String(body.name).trim().length > 80)
  )
    return 'Folder names must be 1–80 characters.';
  if (
    ['renameFolder', 'deleteFolder'].includes(body.action) &&
    !UUID.test(String(body.folderId || ''))
  )
    return 'A valid folder is required.';
  if (body.action === 'deleteDraft' && !UUID.test(String(body.draftId || '')))
    return 'A valid draft is required.';
  if (['move', 'star', 'read', 'unread'].includes(body.action)) {
    if (
      !Array.isArray(body.threadIds) ||
      body.threadIds.length < 1 ||
      body.threadIds.length > 100 ||
      body.threadIds.some((id: unknown) => !UUID.test(String(id)))
    )
      return 'Select 1–100 conversations.';
    if (body.action === 'star' && typeof body.starred !== 'boolean')
      return 'Starred must be a boolean.';
    if (body.action === 'move' && body.folderId && !UUID.test(String(body.folderId)))
      return 'A valid folder is required.';
    if (
      body.action === 'move' &&
      body.folder &&
      !['inbox', 'archive', 'spam', 'trash'].includes(body.folder)
    )
      return 'Invalid destination.';
  }
  return null;
}
export function mailViewQuery(query: any, view: string) {
  if (view.startsWith('folder:'))
    return query.eq('custom_folder_id', view.slice(7)).not('folder', 'in', '(trash,spam)');
  if (['trash', 'spam', 'archive'].includes(view)) return query.eq('folder', view);
  if (view === 'starred') return query.eq('starred', true).not('folder', 'in', '(trash,spam)');
  if (view === 'sent' || view === 'all') return query.not('folder', 'in', '(trash,spam)');
  return query.eq('folder', 'inbox');
}
