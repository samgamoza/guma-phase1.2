'use client'

import { Trash2 } from 'lucide-react'

export function DeleteSiteButton({ siteId }: { siteId: string }) {
  return (
    <form
      action="/api/admin/sites/delete"
      method="POST"
      className="inline"
      onSubmit={(e) => { if (!confirm('Delete this site?')) e.preventDefault() }}
    >
      <input type="hidden" name="website_id" value={siteId} />
      <button type="submit" className="btn-ghost text-xs p-1.5 text-red-400 hover:text-red-600" title="Delete site">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </form>
  )
}
