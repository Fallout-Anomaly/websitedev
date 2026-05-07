"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { updateBugReport, addBugComment, getBugComments, deleteBugComment } from "@/app/staff/modlist/actions";
import TiptapEditor, {
  type TiptapEditorHandle,
  isTiptapEmptyHtml,
} from "./TiptapEditor";
import SupportTicketMarkdown from "./staff/SupportTicketMarkdown";
import { plainTextPreview } from "@/src/lib/plain-text-preview";
import { displayNameOrTeamMember } from "@/src/lib/display-name";
import { formatReporterLabel } from "@/src/lib/reporter-label";
import ProfileAvatar from "@/src/components/ProfileAvatar";

export type BugReport = {
  id: number;
  date_reported: string;
  reported_by: string;
  mod_name: string;
  issue_description: string;
  severity: string;
  status: string;
  resolution_notes: string;
  comments?: any[] | null;
};

type Props = {
  bug: BugReport | null;
  onClose: () => void;
};

export default function BugDetailDrawer({ bug, onClose }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const mainEditorRef = useRef<TiptapEditorHandle>(null);
  const threadEditorRef = useRef<TiptapEditorHandle>(null);
  
  // Form State
  const [modName, setModName] = useState("");
  const [desc, setDesc] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [resNotes, setResNotes] = useState("");
  const [newCommentHtml, setNewCommentHtml] = useState("");
  const [threadReplyHtml, setThreadReplyHtml] = useState("");

  const loadComments = useCallback(async () => {
    if (!bug) return;
    setFeedError(null);
    setLoading(true);
    try {
      const res = await getBugComments(bug.id);
      if (res.error) {
        setFeedError(res.error);
        setComments([]);
      } else {
        setComments(res.data || []);
      }
    } catch (e) {
      setFeedError(e instanceof Error ? e.message : "Failed to load discussion");
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [bug]);

  useEffect(() => {
    if (bug) {
      setModName(bug.mod_name || "");
      setDesc(bug.issue_description || "");
      setSeverity(bug.severity || "");
      setStatus(bug.status || "");
      setResNotes(bug.resolution_notes || "");
      void loadComments();
    } else {
      setComments([]);
      setFeedError(null);
      setSelectedThread(null);
    }
  }, [bug, loadComments]);

  async function handleSubmitComment() {
    if (!bug) return;
    const isThread = !!selectedThread;
    const html = isThread 
      ? threadEditorRef.current?.getHTML() ?? threadReplyHtml
      : mainEditorRef.current?.getHTML() ?? newCommentHtml;
    
    if (isTiptapEmptyHtml(html)) return;

    setLoading(true);
    try {
      const res = await addBugComment(bug.id, html, selectedThread?.id || null);

      if (!res.error) {
        if (isThread) {
          threadEditorRef.current?.clear();
          setThreadReplyHtml("");
        } else {
          mainEditorRef.current?.clear();
          setNewCommentHtml("");
        }
        await loadComments();
      } else {
        alert("Error adding comment: " + res.error);
      }
    } catch (e) {
      alert("Could not save comment: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteComment(id: number) {
    if (!bug || !confirm("Delete this comment?")) return;
    setLoading(true);
    try {
      const res = await deleteBugComment(bug.id, id);
      if (!res.error) {
        await loadComments();
        if (selectedThread?.id === id) setSelectedThread(null);
      } else {
        alert("Error: " + res.error);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(overridingStatus?: string) {
    if (!bug) return;
    setLoading(true);
    const targetStatus = overridingStatus || status;
    try {
      const res = await updateBugReport(bug.id, {
        mod_name: modName,
        issue_description: desc,
        severity: severity,
        status: targetStatus,
        resolution_notes: resNotes
      });
      
      if (!res.error) {
        alert(overridingStatus ? `Issue marked as ${overridingStatus}.` : "Updated successfully.");
        window.location.reload();
      } else {
        alert("Error: " + res.error);
      }
    } finally {
      setLoading(false);
      setIsEditing(false);
    }
  }

  if (!bug) return null;

  const rootComments = comments.filter(c => !c.parent_id);
  const threadReplies = selectedThread ? comments.filter(r => r.parent_id === selectedThread.id) : [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 animate-in fade-in" onClick={onClose} />
      
      {/* Drawer Content */}
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-[#30363d] bg-[#0d1117] shadow-2xl animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="border-b border-[#30363d] bg-[#0d1117] p-6">
          <div className="flex items-start justify-between">
            <div className="flex-grow">
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  bug.status === 'Closed' ? 'border-purple-500/30 text-purple-400 bg-purple-500/5' : 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                }`}>
                  {bug.status}
                </span>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Issue #{bug.id}</span>
              </div>
              
              {isEditing ? (
                <input 
                  value={modName}
                  onChange={(e) => setModName(e.target.value)}
                  className="w-full bg-[#0d1117] border border-white/10 rounded px-3 py-2 text-xl font-bold text-white focus:border-blue-500 outline-none"
                />
              ) : (
                <h2 className="text-xl font-bold text-white tracking-tight leading-tight">
                  {bug.mod_name}:{" "}
                  {plainTextPreview(bug.issue_description || "", 72)}
                </h2>
              )}

              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                <span className="font-semibold text-gray-300">
                  {formatReporterLabel(bug.reported_by)}
                </span>
                <span>opened this issue on {new Date(bug.date_reported).toLocaleDateString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 rounded-md transition-all ${isEditing ? 'bg-blue-500 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
              </button>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-md text-gray-500 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {isEditing ? (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Issue Description</label>
                <textarea 
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full h-40 bg-[#0d1117] border border-white/10 rounded-lg p-4 text-sm text-gray-300 outline-none focus:border-blue-500 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Severity</label>
                  <select 
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-lg p-2 text-sm text-gray-300 outline-none focus:border-blue-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Status</label>
                  <select 
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#0d1117] border border-white/10 rounded-lg p-2 text-sm text-gray-300 outline-none focus:border-blue-500"
                  >
                    <option value="New">New</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-white/5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Resolution Notes</label>
                <textarea 
                  value={resNotes}
                  onChange={(e) => setResNotes(e.target.value)}
                  className="w-full h-32 bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-4 text-sm text-emerald-200 outline-none focus:border-emerald-500 transition-all resize-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                   <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500">Description</h3>
                   <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{bug.mod_name}</span>
                </div>
                <div className="rounded-lg border border-[#30363d] bg-[#0d1117] p-4">
                  {bug.issue_description?.trim() ? (
                    <SupportTicketMarkdown source={bug.issue_description} />
                  ) : (
                    <p className="text-sm text-[#8b949e]">No description provided.</p>
                  )}
                </div>
              </div>

              {bug.resolution_notes && (
                <div className="space-y-3 border-t border-[#21262d] pt-6">
                  <h3 className="text-xs font-semibold text-[#3fb950]">Resolution</h3>
                  <div className="rounded-lg border border-[#238636]/30 bg-[#238636]/5 p-4">
                    <SupportTicketMarkdown source={bug.resolution_notes} />
                  </div>
                </div>
              )}

              {/* Discussion Feed */}
              <div className="border-t border-[#21262d] pt-8">
                <h3 className="mb-4 text-xs font-semibold text-[#8b949e]">Staff discussion</h3>
                
                {feedError && (
                  <div className="space-y-2 border-l-2 border-amber-500/50 py-2 pl-4 text-xs text-amber-200">
                    <p className="font-medium text-amber-400">Could not load discussion</p>
                    <button type="button" onClick={() => void loadComments()} className="text-[#58a6ff] hover:underline">Retry</button>
                  </div>
                )}
                
                {loading && rootComments.length === 0 && !feedError ? (
                  <div className="py-10 text-center text-sm text-[#8b949e] animate-pulse">Loading…</div>
                ) : !feedError && rootComments.length === 0 ? (
                  <div className="py-10 text-center text-sm text-[#8b949e]">No discussions yet.</div>
                ) : (
                  <div className="divide-y divide-[#21262d]">
                    {rootComments.map((c) => {
                      const replyCount = comments.filter(r => r.parent_id === c.id).length;
                      return (
                        <div 
                          key={c.id} 
                          onDoubleClick={() => setSelectedThread(c)}
                          className="group cursor-pointer select-none py-5"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs text-[#8b949e]">
                              <span className="flex items-center gap-2 font-semibold text-[#c9d1d9]">
                            <ProfileAvatar
                              storedPreset={c.avatar_preset}
                              seed={c.user_id}
                              label={displayNameOrTeamMember(c.display_name)}
                              size={22}
                            />
                            {displayNameOrTeamMember(c.display_name)}
                          </span>
                              <span className="text-[#484f58]">·</span>
                              <span>{new Date(c.created_at).toLocaleString()}</span>
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteComment(c.id); }}
                              className="opacity-0 transition-opacity group-hover:opacity-100 p-1 text-[#8b949e] hover:text-[#f85149]"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                            </button>
                          </div>
                          <div className="prose prose-invert prose-sm max-w-none text-[#c9d1d9]">
                            <div dangerouslySetInnerHTML={{ __html: c.content }} />
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-[#6e7681]">
                             {replyCount > 0 && (
                               <span>
                                 {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
                               </span>
                             )}
                             <span className="opacity-0 transition-opacity group-hover:opacity-100">Double-click to expand thread</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Input (Main Feed) */}
        {!selectedThread && !isEditing && (
          <div className="border-t border-[#30363d] bg-[#0d1117] p-6">
            <div className="flex gap-4 items-end">
              <div className="flex-grow">
                <TiptapEditor 
                  ref={mainEditorRef}
                  content={newCommentHtml}
                  onChange={setNewCommentHtml}
                  onSubmit={handleSubmitComment}
                  placeholder="Add a staff note..."
                />
              </div>
              <button 
                onClick={handleSubmitComment}
                className="mb-1 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 shadow-lg shadow-blue-500/20"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
              </button>
            </div>
          </div>
        )}

        {/* Edit Mode Footer */}
        {isEditing && (
          <div className="flex justify-end gap-3 border-t border-[#30363d] bg-[#0d1117] p-6">
             <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-white">Discard</button>
             <button onClick={() => handleUpdate()} disabled={loading} className="px-6 py-2 bg-emerald-600 text-black rounded-md text-xs font-black uppercase tracking-widest hover:bg-emerald-500 disabled:opacity-50">Save Updates</button>
          </div>
        )}

        {/* THREAD POPUP OVERLAY */}
        {selectedThread && (
          <div className="absolute inset-0 z-50 flex flex-col border-l border-[#30363d] bg-[#0d1117] animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-[#30363d] p-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedThread(null)}
                  className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                </button>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500">Thread Discussion</h3>
              </div>
              <button onClick={() => setSelectedThread(null)} className="text-[10px] font-black uppercase tracking-widest text-gray-600 hover:text-white">Close Thread</button>
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-8 custom-scrollbar">
              {/* Root Comment */}
              <div className="border-b border-[#21262d] pb-8">
                <div className="mb-2 flex items-center gap-2 text-xs text-[#8b949e]">
                  <span className="flex items-center gap-2 font-semibold text-[#58a6ff]">
                    <ProfileAvatar
                      storedPreset={selectedThread.avatar_preset}
                      seed={selectedThread.user_id}
                      label={displayNameOrTeamMember(selectedThread.display_name)}
                      size={22}
                    />
                    {displayNameOrTeamMember(selectedThread.display_name)}
                  </span>
                  <span className="text-[#484f58]">·</span>
                  <span>{new Date(selectedThread.created_at).toLocaleString()}</span>
                </div>
                <div className="prose prose-invert max-w-none text-[#e6edf3]">
                  <div dangerouslySetInnerHTML={{ __html: selectedThread.content }} />
                </div>
              </div>

              {/* Responses */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-600 mb-4 flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-gray-600" />
                  Responses
                </h4>
                {threadReplies.length === 0 ? (
                  <div className="text-center py-10 text-gray-700 text-xs font-bold uppercase tracking-widest">No responses yet.</div>
                ) : (
                  threadReplies.map(reply => (
                    <div key={reply.id} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <ProfileAvatar
                              storedPreset={reply.avatar_preset}
                              seed={reply.user_id}
                              label={displayNameOrTeamMember(reply.display_name)}
                              size={18}
                            />
                            {displayNameOrTeamMember(reply.display_name)}
                          </span>
                          <span className="text-[10px] text-gray-700">{new Date(reply.created_at).toLocaleString()}</span>
                        </div>
                        <button 
                          onClick={() => handleDeleteComment(reply.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all text-gray-700"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                        </button>
                      </div>
                      <div className="prose prose-sm prose-invert max-w-none text-[#c9d1d9]">
                        <div dangerouslySetInnerHTML={{ __html: reply.content }} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Reply Input */}
            <div className="border-t border-[#30363d] bg-[#0d1117] p-6">
              <div className="flex gap-4 items-end">
                <div className="flex-grow">
                  <TiptapEditor 
                    ref={threadEditorRef}
                    content={threadReplyHtml} 
                    onChange={setThreadReplyHtml} 
                    onSubmit={handleSubmitComment}
                    placeholder="Type a response..." 
                  />
                </div>
                <button onClick={handleSubmitComment} className="mb-1 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
