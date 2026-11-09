import React, { useState } from 'react';
import {
  Shield,
  Users,
  Inbox,
  Layers,
  CheckSquare,
  Check,
  Trash2,
  MessageSquare,
  FileSpreadsheet,
  Image as ImageIcon,
  Edit2,
  Save,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useCommunity } from '../../hooks/useCommunity';
import type { SkillGroup } from '../../types/community';
import { compressImage } from '../../utils/imageCompression';

export const AdminPanelSection: React.FC = () => {
  const {
    currentUser,
    isAdmin,
    isHostAdmin,
    students,
    groups,
    commonTask,
    uploadRequests,
    communityPosts,
    approveUploadRequest,
    rejectUploadRequest,
    makeStudentAdmin,
    demoteAdminToStudent,
    deleteStudent,
    createSkillGroup,
    updateSkillGroup,
    deleteSkillGroup,
    updateCommonTask,
    createCommunityPost,
    updateCommunityPost,
    deleteCommunityPost,
    resetToDefaults,
  } = useCommunity();

  const [activeTab, setActiveTab] = useState<'students' | 'requests' | 'groups' | 'task' | 'post'>('students');
  const [studentPage, setStudentPage] = useState(1);
  const studentPageSize = 15;
  const totalStudentPages = Math.max(1, Math.ceil(students.length / studentPageSize));
  const paginatedAdminStudents = students.slice((studentPage - 1) * studentPageSize, studentPage * studentPageSize);

  // Form for new skill group
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupCategory, setNewGroupCategory] = useState('Programming');
  const [newGroupAdminName, setNewGroupAdminName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  // Editing state for skill groups
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupName, setEditGroupName] = useState('');
  const [editGroupCategory, setEditGroupCategory] = useState('');
  const [editGroupAdminName, setEditGroupAdminName] = useState('');
  const [editGroupDesc, setEditGroupDesc] = useState('');

  // Editing state for community posts
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editPostContent, setEditPostContent] = useState('');
  const [editPostTitle, setEditPostTitle] = useState('');

  // Form for editing common task
  const [taskTitle, setTaskTitle] = useState(commonTask.title);
  const [taskDeadline, setTaskDeadline] = useState(commonTask.deadline);
  const [taskDesc, setTaskDesc] = useState(commonTask.description);
  const [taskReqs, setTaskReqs] = useState(commonTask.requirements.join('\n'));
  const [taskSavedFeedback, setTaskSavedFeedback] = useState(false);

  // Form for publishing community post
  const [postType, setPostType] = useState<'text' | 'note' | 'image'>('text');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postMediaUrl, setPostMediaUrl] = useState('');
  const [postTag, setPostTag] = useState('Official');
  const [postCreatedFeedback, setPostCreatedFeedback] = useState(false);

  // Rejection feedback state
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectFeedbackText, setRejectFeedbackText] = useState('');

  if (!isAdmin) {
    return (
      <div className="py-24 bg-[#FFFFFF] min-h-screen text-[#080808] flex items-center justify-center px-4">
        <div className="max-w-md w-full p-8 rounded-3xl bg-[#F9FAFB] border border-[#E5E7EB] text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center text-[#DC2626] mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-[#080808]">Admin Access Restricted</h2>
          <p className="text-xs text-[#555555] leading-relaxed">
            This area is exclusively accessible to the Community Admin. Please sign in or register with an Administrator account.
          </p>
        </div>
      </div>
    );
  }

  const pendingRequests = uploadRequests.filter((r) => r.status === 'pending');

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    createSkillGroup(
      newGroupName.trim(),
      newGroupDesc.trim(),
      newGroupCategory.trim(),
      newGroupAdminName.trim() || currentUser?.name || 'Admin'
    );

    setNewGroupName('');
    setNewGroupDesc('');
    setNewGroupAdminName('');
  };

  const handleStartEditGroup = (g: SkillGroup) => {
    setEditingGroupId(g.id);
    setEditGroupName(g.name);
    setEditGroupCategory(g.category);
    setEditGroupAdminName(g.adminName);
    setEditGroupDesc(g.description);
  };

  const handleSaveEditGroup = (groupId: string) => {
    if (!editGroupName.trim()) return;
    updateSkillGroup(groupId, {
      name: editGroupName.trim(),
      category: editGroupCategory.trim(),
      adminName: editGroupAdminName.trim(),
      description: editGroupDesc.trim(),
    });
    setEditingGroupId(null);
  };

  const handleDeleteGroup = (groupId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete skill group "${name}"?`)) {
      deleteSkillGroup(groupId);
    }
  };

  const handleSaveCommonTask = (e: React.FormEvent) => {
    e.preventDefault();
    const requirements = taskReqs
      .split('\n')
      .map((r) => r.trim())
      .filter(Boolean);

    updateCommonTask({
      title: taskTitle.trim(),
      deadline: taskDeadline.trim(),
      description: taskDesc.trim(),
      requirements,
    });

    setTaskSavedFeedback(true);
    setTimeout(() => setTaskSavedFeedback(false), 2500);
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postContent.trim()) return;

    createCommunityPost({
      type: postType,
      title: postTitle.trim() || undefined,
      content: postContent.trim(),
      mediaUrl: postMediaUrl.trim() || undefined,
      tag: postTag.trim(),
    });

    setPostTitle('');
    setPostContent('');
    setPostMediaUrl('');
    setPostCreatedFeedback(true);
    setTimeout(() => setPostCreatedFeedback(false), 2500);
  };

  const handleRejectConfirm = (reqId: string) => {
    rejectUploadRequest(reqId, rejectFeedbackText);
    setRejectingId(null);
    setRejectFeedbackText('');
  };

  const handleExportExcel = () => {
    const headers = ['Student Name', 'Private Email', 'Private Phone', 'College ID', 'Role', 'Groups', 'Common Task', 'Skills'];
    const rows = students.map((s) => [
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.email}"`,
      `"${s.phone || 'N/A'}"`,
      `"${s.collegeId || 'N/A'}"`,
      `"${s.role}"`,
      `"${s.joinedGroupIds.length}/2"`,
      `"${s.completedCommonTask ? 'Done' : 'Pending'}"`,
      `"${s.skills.map((sk) => sk.name).join('; ')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.href = encodedUri;
    link.download = `admin_students_database_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePostImageDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const compressed = await compressImage(file, 900, 900, 0.75);
      setPostMediaUrl(compressed);
    } catch (err) {
      console.warn('Post image compression failed', err);
    }
  };

  return (
    <div className="py-10 bg-[#FFFFFF] min-h-screen text-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E5E7EB] mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F4F6] border border-[#D1D5DB] text-[10px] font-mono uppercase tracking-wider text-[#080808] mb-3">
              <Shield className="w-3 h-3 text-[#080808]" />
              <span>Full Management Authority</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#080808] tracking-tight">
              Main Admin Control Panel
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-1">
              Logged in as <strong className="text-[#080808]">{currentUser?.name}</strong>. Manage student accounts, review submissions, edit common task, and configure skill groups.
            </p>
          </div>

          {isHostAdmin && (
            <div className="flex items-center gap-3">
              <button
                onClick={resetToDefaults}
                type="button"
                className="px-3 py-1.5 rounded-lg bg-[#FFFFFF] hover:bg-[#F3F4F6] border border-[#D1D5DB] text-[11px] font-mono text-[#666666] hover:text-[#080808] cursor-pointer shadow-xs"
                title="Reset state to initial seed demonstration data"
              >
                Reset Data to Defaults
              </button>
            </div>
          )}
        </div>

        {/* Admin Navigation Sub-Tabs */}
        <div className="flex items-center gap-2 border-b border-[#E5E7EB] mb-8 overflow-x-auto pb-1">
          {[
            { id: 'students', label: `Manage Students (${students.length})`, icon: Users },
            {
              id: 'requests',
              label: `Review Uploads (${pendingRequests.length} Pending)`,
              icon: Inbox,
              badge: pendingRequests.length > 0 ? `${pendingRequests.length}` : undefined,
            },
            { id: 'groups', label: `Skill Groups (${groups.length})`, icon: Layers },
            { id: 'task', label: 'Common Task', icon: CheckSquare },
            { id: 'post', label: 'Publish to Feed', icon: MessageSquare },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                type="button"
                className={`px-4 py-3 rounded-t-xl text-xs font-semibold flex items-center gap-2 border-b-2 whitespace-nowrap cursor-pointer transition-all ${
                  isActive
                    ? 'bg-[#FFFFFF] text-[#080808] border-[#080808] shadow-xs'
                    : 'text-[#666666] border-transparent hover:text-[#080808] hover:bg-[#F9FAFB]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#080808] text-white font-bold">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* TAB 1: MANAGE STUDENTS & PRIVATE DETAILS */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-[#080808]">Registered Student Accounts</h3>
                <p className="text-xs text-[#555555]">
                  Full access to private student information (Email, Phone, College ID) and role management.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleExportExcel}
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#080808] text-white hover:bg-[#222222] text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
                  title="Download student database as MS Excel compatible CSV"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Export to MS Excel</span>
                </button>
                <span className="text-xs font-mono text-[#666666]">{students.length} Total Users</span>
              </div>
            </div>

            <div className="rounded-3xl bg-[#FFFFFF] border border-[#E5E7EB] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F9FAFB] text-[#666666] font-mono uppercase text-[10px] border-b border-[#E5E7EB]">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Student Name</th>
                      <th className="py-3 px-4 font-semibold">Private Email</th>
                      <th className="py-3 px-4 font-semibold">Private Phone</th>
                      <th className="py-3 px-4 font-semibold">College ID</th>
                      <th className="py-3 px-4 font-semibold">Role</th>
                      <th className="py-3 px-4 font-semibold">Groups</th>
                      <th className="py-3 px-4 font-semibold">Common Task</th>
                      <th className="py-3 px-4 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB]">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-xs text-[#888888] font-mono">
                          No registered accounts yet.
                        </td>
                      </tr>
                    ) : (
                      paginatedAdminStudents.map((st) => (
                      <tr key={st.id} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="py-3 px-4 font-bold text-[#080808] whitespace-nowrap">
                          {st.name}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#080808] whitespace-nowrap">
                          {st.email}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#555555] whitespace-nowrap">
                          {st.phone || 'N/A'}
                        </td>
                        <td className="py-3 px-4 font-mono text-[#555555] whitespace-nowrap">
                          {st.collegeId || 'N/A'}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`text-[9px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                              st.role === 'admin'
                                ? 'bg-[#080808] text-white'
                                : 'bg-[#F3F4F6] text-[#555555] border border-[#D1D5DB]'
                            }`}
                          >
                            {st.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[#555555] whitespace-nowrap">
                          {st.joinedGroupIds.length} / 2
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {st.completedCommonTask ? (
                            <span className="text-[10px] font-mono text-[#080808] font-bold">✓ Done</span>
                          ) : (
                            <span className="text-[10px] font-mono text-[#888888]">Pending</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {st.id === 'pioneerpixel-host-admin' || st.email?.toLowerCase() === 'arsalansahil02@gmail.com' ? (
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#080808] text-white font-bold">
                                Host Admin (Root)
                              </span>
                            ) : isHostAdmin ? (
                              <>
                                {st.role !== 'admin' ? (
                                  <button
                                    onClick={() => makeStudentAdmin(st.id)}
                                    type="button"
                                    className="px-2.5 py-1 rounded bg-[#F3F4F6] hover:bg-[#080808] hover:text-white text-[10px] font-mono text-[#080808] transition-colors cursor-pointer border border-[#D1D5DB]"
                                    title="Promote to Admin"
                                  >
                                    Make Admin
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => demoteAdminToStudent(st.id)}
                                    type="button"
                                    className="px-2.5 py-1 rounded bg-[#FEF2F2] hover:bg-[#DC2626] hover:text-white text-[10px] font-mono text-[#DC2626] transition-colors cursor-pointer border border-[#FCA5A5]"
                                    title="Revoke Admin status"
                                  >
                                    Remove Admin
                                  </button>
                                )}

                                {st.id !== currentUser?.id && (
                                  <button
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `Permanently delete user ${st.name} (${st.email})? This user will be removed completely from the community, dashboard, and database.`
                                        )
                                      ) {
                                        deleteStudent(st.id);
                                      }
                                    }}
                                    type="button"
                                    className="p-1 rounded text-[#888888] hover:text-[#DC2626] transition-colors cursor-pointer"
                                    title="Permanently Delete User"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </>
                            ) : (
                              <span className="text-[10px] font-mono text-[#888888]">
                                {st.role === 'admin' ? 'Admin' : 'Student'}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls for 100+ Students */}
            {students.length > studentPageSize && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs text-xs">
                <div className="font-mono text-[#666666]">
                  Showing <span className="font-bold text-[#080808]">{(studentPage - 1) * studentPageSize + 1}</span>–<span className="font-bold text-[#080808]">{Math.min(studentPage * studentPageSize, students.length)}</span> of <span className="font-bold text-[#080808]">{students.length}</span> students
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStudentPage((p) => Math.max(1, p - 1))}
                    disabled={studentPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#080808] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <div className="flex items-center gap-1 px-1">
                    {Array.from({ length: totalStudentPages }, (_, i) => i + 1).map((pg) => (
                      <button
                        key={pg}
                        type="button"
                        onClick={() => setStudentPage(pg)}
                        className={`w-7 h-7 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer ${
                          studentPage === pg
                            ? 'bg-[#080808] text-white shadow-xs'
                            : 'bg-white border border-[#E5E7EB] text-[#555555] hover:bg-[#F3F4F6]'
                        }`}
                      >
                        {pg}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStudentPage((p) => Math.min(totalStudentPages, p + 1))}
                    disabled={studentPage === totalStudentPages}
                    className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#080808] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold cursor-pointer shadow-xs transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REVIEW STUDENT UPLOADS */}
        {activeTab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-[#080808]">Review Student Upload Requests</h3>
              <p className="text-xs text-[#555555]">
                Students cannot post directly to the public community feed. Approve requests to publish them to the community feed.
              </p>
            </div>

            {uploadRequests.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#666666] bg-[#FFFFFF] rounded-3xl border border-[#E5E7EB]">
                No student upload requests received yet.
              </div>
            ) : (
              <div className="space-y-4">
                {uploadRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-6 rounded-3xl bg-[#FFFFFF] border border-[#E5E7EB] space-y-3 shadow-xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E5E7EB]">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[#080808]">{req.title}</h4>
                          <span className="text-[9px] font-mono uppercase px-2 py-0.5 rounded bg-[#F3F4F6] border border-[#D1D5DB] text-[#080808]">
                            Type: {req.type}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-[#666666] mt-0.5">
                          Submitted by <strong className="text-[#080808]">{req.studentName}</strong> ({req.studentEmail}) • {req.submittedAt}
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                          req.status === 'approved'
                            ? 'bg-[#080808] text-white'
                            : req.status === 'rejected'
                            ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]'
                            : 'bg-[#F3F4F6] text-[#080808] border border-[#D1D5DB]'
                        }`}
                      >
                        Status: {req.status}
                      </span>
                    </div>

                    <p className="text-xs text-[#333333] leading-relaxed whitespace-pre-line bg-[#F9FAFB] p-4 rounded-xl border border-[#E5E7EB]">
                      {req.content}
                    </p>

                    {req.mediaUrl && (
                      <div className="pt-1">
                        <img
                          src={req.mediaUrl}
                          alt={req.title}
                          className="rounded-xl max-h-56 object-cover border border-[#E5E7EB]"
                        />
                      </div>
                    )}

                    {/* Action Bar for Pending Requests */}
                    {req.status === 'pending' && (
                      <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E5E7EB]">
                        {rejectingId === req.id ? (
                          <div className="flex items-center gap-2 w-full">
                            <input
                              type="text"
                              value={rejectFeedbackText}
                              onChange={(e) => setRejectFeedbackText(e.target.value)}
                              placeholder="Reason for rejection (optional feedback for student)..."
                              className="flex-1 px-3 py-1.5 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808]"
                            />
                            <button
                              onClick={() => handleRejectConfirm(req.id)}
                              type="button"
                              className="px-3 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-bold hover:bg-[#B91C1C]"
                            >
                              Confirm Reject
                            </button>
                            <button
                              onClick={() => setRejectingId(null)}
                              type="button"
                              className="px-2 py-1.5 text-xs text-[#666666]"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                setRejectingId(req.id);
                                setRejectFeedbackText('');
                              }}
                              type="button"
                              className="px-4 py-2 rounded-xl bg-[#F3F4F6] hover:bg-[#E5E7EB] text-xs font-mono text-[#080808] cursor-pointer border border-[#D1D5DB]"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => approveUploadRequest(req.id)}
                              type="button"
                              className="px-5 py-2 rounded-xl bg-[#080808] text-white hover:bg-[#222222] text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Publish to Public Feed</span>
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: MANAGE SKILL GROUPS */}
        {activeTab === 'groups' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Create Skill Group Form */}
            <div className="lg:col-span-5 rounded-3xl bg-[#FFFFFF] border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
              <h3 className="text-lg font-bold text-[#080808] mb-1">Create New Skill Group</h3>
              <p className="text-xs text-[#555555] mb-6">
                Add specialized skill groups and assign the mentor or teacher who will lead it.
              </p>

              <form onSubmit={handleCreateGroup} className="space-y-4 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-[#666666] font-semibold mb-1">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    required
                    placeholder="e.g. Flutter Development, UI/UX Design"
                    className="w-full px-3 py-2 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] focus:outline-none focus:border-[#080808]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-[#666666] font-semibold mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={newGroupCategory}
                    onChange={(e) => setNewGroupCategory(e.target.value)}
                    placeholder="e.g. Programming, Creative Media, Development"
                    className="w-full px-3 py-2 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] focus:outline-none focus:border-[#080808]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-[#666666] font-semibold mb-1">
                    Group Admin (Teacher / Lead Student)
                  </label>
                  <input
                    type="text"
                    value={newGroupAdminName}
                    onChange={(e) => setNewGroupAdminName(e.target.value)}
                    placeholder="e.g. Rohit Patel"
                    className="w-full px-3 py-2 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] focus:outline-none focus:border-[#080808]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono text-[#666666] font-semibold mb-1">
                    Description
                  </label>
                  <textarea
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    rows={3}
                    required
                    placeholder="What will members learn in this skill group?"
                    className="w-full px-3 py-2 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] focus:outline-none focus:border-[#080808]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-[#080808] text-white font-bold hover:bg-[#222222] cursor-pointer shadow-sm"
                >
                  Create Skill Group
                </button>
              </form>
            </div>

            {/* Existing Groups List */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-lg font-bold text-[#080808] mb-1">Existing Skill Groups ({groups.length})</h3>
              <p className="text-xs text-[#555555] mb-4">
                Students can choose and join a maximum of 2 groups at a time.
              </p>

              <div className="space-y-3">
                {groups.length === 0 ? (
                  <div className="py-12 text-center text-xs text-[#888888] font-mono bg-[#FFFFFF] rounded-2xl border border-[#E5E7EB]">
                    No skill groups created yet. Use the form on the left to create the first group.
                  </div>
                ) : (
                  groups.map((group) => {
                    const isEditing = editingGroupId === group.id;
                    return (
                      <div
                        key={group.id}
                        className="p-5 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs space-y-3"
                      >
                        {isEditing ? (
                          <div className="space-y-3 text-xs">
                            <div className="font-bold text-[#080808] text-xs">Edit Group Details</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-mono text-[#666666] mb-1">Group Name</label>
                                <input
                                  type="text"
                                  value={editGroupName}
                                  onChange={(e) => setEditGroupName(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] text-xs"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-mono text-[#666666] mb-1">Category</label>
                                <input
                                  type="text"
                                  value={editGroupCategory}
                                  onChange={(e) => setEditGroupCategory(e.target.value)}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] text-xs"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-[#666666] mb-1">Mentor / Admin Name</label>
                              <input
                                type="text"
                                value={editGroupAdminName}
                                onChange={(e) => setEditGroupAdminName(e.target.value)}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] text-xs"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-mono text-[#666666] mb-1">Description</label>
                              <textarea
                                value={editGroupDesc}
                                onChange={(e) => setEditGroupDesc(e.target.value)}
                                rows={2}
                                className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] text-xs"
                              />
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() => handleSaveEditGroup(group.id)}
                                className="px-3 py-1.5 rounded-lg bg-[#080808] text-white font-bold text-xs flex items-center gap-1.5 hover:bg-[#222222] cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Save Changes</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingGroupId(null)}
                                className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] text-xs text-[#666666] hover:bg-[#F3F4F6] cursor-pointer flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Cancel</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-base font-bold text-[#080808]">{group.name}</h4>
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-[#555555]">
                                  {group.category}
                                </span>
                              </div>
                              <p className="text-xs text-[#555555] mb-2">{group.description}</p>
                              <div className="text-[11px] font-mono text-[#080808] flex flex-wrap items-center gap-3">
                                <span>Mentor: <strong>{group.adminName}</strong></span>
                                <span>•</span>
                                <span>{group.memberIds.length} Members</span>
                                <span>•</span>
                                <span>{group.resources.length} Resources</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleStartEditGroup(group)}
                                className="px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] text-xs font-semibold text-[#080808] hover:bg-[#F3F4F6] flex items-center gap-1 cursor-pointer"
                                title="Edit group info"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-[#666666]" />
                                <span>Edit</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteGroup(group.id, group.name)}
                                className="p-1.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-colors cursor-pointer"
                                title="Delete group"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: MANAGE COMMON TASK */}
        {activeTab === 'task' && (
          <div className="max-w-2xl rounded-3xl bg-[#FFFFFF] border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
            <h3 className="text-lg font-bold text-[#080808] mb-1">Manage Common Task</h3>
            <p className="text-xs text-[#555555] mb-6">
              Update the single common task assigned to all students across the community.
            </p>

            {taskSavedFeedback && (
              <div className="mb-4 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#15803D]">
                ✓ Common Task updated successfully for all students!
              </div>
            )}

            <form onSubmit={handleSaveCommonTask} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-mono text-[#666666] font-semibold mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] focus:outline-none focus:border-[#080808]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#666666] font-semibold mb-1">
                  Deadline
                </label>
                <input
                  type="text"
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] focus:outline-none focus:border-[#080808]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#666666] font-semibold mb-1">
                  Description
                </label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  rows={4}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] focus:outline-none focus:border-[#080808]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#666666] font-semibold mb-1">
                  Requirements (One step per line)
                </label>
                <textarea
                  value={taskReqs}
                  onChange={(e) => setTaskReqs(e.target.value)}
                  rows={5}
                  required
                  className="w-full px-3 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] focus:outline-none focus:border-[#080808] font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#080808] text-white font-bold hover:bg-[#222222] cursor-pointer shadow-sm"
              >
                Save and Broadcast Common Task
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: PUBLISH COMMUNITY POST */}
        {activeTab === 'post' && (
          <div className="max-w-2xl rounded-3xl bg-[#FFFFFF] border border-[#E5E7EB] p-6 sm:p-8 shadow-xs">
            <h3 className="text-lg font-bold text-[#080808] mb-1">Publish to Community Feed</h3>
            <p className="text-xs text-[#555555] mb-6">
              Only authorized Admins can directly publish public posts to the student feed.
            </p>

            {postCreatedFeedback && (
              <div className="mb-4 p-3 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] text-xs text-[#15803D]">
                ✓ Post published live on the Community Feed!
              </div>
            )}

            <form onSubmit={handlePublishPost} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] uppercase font-mono text-[#666666] mb-1">
                  Post Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'text', label: 'Text / Announcement' },
                    { id: 'note', label: 'Study Note' },
                    { id: 'image', label: 'Image / Highlight' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setPostType(t.id as any)}
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                        postType === t.id
                          ? 'bg-[#080808] text-white font-bold border-[#080808]'
                          : 'bg-[#F9FAFB] border-[#D1D5DB] text-[#555555] hover:text-[#080808]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#666666] font-semibold mb-1">
                  Headline / Title (Optional)
                </label>
                <input
                  type="text"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. Campus Hackathon Announced"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] focus:outline-none focus:border-[#080808]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#666666] font-semibold mb-1">
                  Tag Badge
                </label>
                <input
                  type="text"
                  value={postTag}
                  onChange={(e) => setPostTag(e.target.value)}
                  placeholder="e.g. Announcement, Workshop, Tip"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] focus:outline-none focus:border-[#080808]"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono text-[#666666] font-semibold mb-1">
                  Post Text Body
                </label>
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  rows={4}
                  required
                  placeholder="Write message for students..."
                  className="w-full px-3 py-2.5 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] focus:outline-none focus:border-[#080808]"
                />
              </div>

              {postType === 'image' && (
                <div>
                  <label className="block text-[10px] uppercase font-mono text-[#666666] font-semibold mb-1">
                    Upload Image Directly from Device or Enter URL
                  </label>

                  {postMediaUrl ? (
                    <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#D1D5DB] space-y-2 mb-2">
                      <div className="h-32 w-full rounded-lg overflow-hidden bg-black/5 flex items-center justify-center">
                        <img
                          src={postMediaUrl}
                          alt="Post Preview"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                          ✓ Image Attached
                        </span>
                        <button
                          type="button"
                          onClick={() => setPostMediaUrl('')}
                          className="text-red-600 hover:underline cursor-pointer"
                        >
                          Change / Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-[#D1D5DB] hover:border-[#080808] rounded-xl p-4 text-center cursor-pointer transition-colors bg-[#F9FAFB] hover:bg-[#FFFFFF] mb-2">
                      <ImageIcon className="w-6 h-6 text-[#666666] mb-1.5" />
                      <span className="font-semibold text-[#080808] text-xs">
                        Click to Choose Image from Your Device
                      </span>
                      <span className="text-[10px] text-[#888888] font-mono mt-0.5">
                        Direct local file upload (PNG, JPG, WEBP)
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handlePostImageDeviceUpload}
                        className="hidden"
                      />
                    </label>
                  )}

                  <input
                    type="url"
                    value={postMediaUrl}
                    onChange={(e) => setPostMediaUrl(e.target.value)}
                    placeholder="Or paste external image URL: https://..."
                    className="w-full px-3 py-2 rounded-lg bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] focus:outline-none focus:border-[#080808]"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#080808] text-white font-bold hover:bg-[#222222] cursor-pointer shadow-sm"
              >
                Publish to Community Feed
              </button>
            </form>

            {/* List & Edit Existing Published Posts */}
            <div className="mt-8 pt-6 border-t border-[#E5E7EB]">
              <h4 className="text-sm font-bold text-[#080808] mb-1">
                Published Feed Posts ({communityPosts.length})
              </h4>
              <p className="text-xs text-[#666666] mb-4">
                Admins can edit content or delete any post from the public stream.
              </p>

              {communityPosts.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#888888] font-mono bg-[#F9FAFB] rounded-xl border border-[#E5E7EB]">
                  No posts published yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {communityPosts.map((post) => {
                    const isEditing = editingPostId === post.id;
                    return (
                      <div
                        key={post.id}
                        className="p-4 rounded-2xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2 text-xs"
                      >
                        {isEditing ? (
                          <div className="space-y-2">
                            <input
                              type="text"
                              value={editPostTitle}
                              onChange={(e) => setEditPostTitle(e.target.value)}
                              placeholder="Post Title..."
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] text-xs bg-white"
                            />
                            <textarea
                              value={editPostContent}
                              onChange={(e) => setEditPostContent(e.target.value)}
                              rows={3}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#D1D5DB] text-xs bg-white"
                            />
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  updateCommunityPost(post.id, {
                                    title: editPostTitle.trim() || undefined,
                                    content: editPostContent.trim(),
                                  });
                                  setEditingPostId(null);
                                }}
                                className="px-3 py-1 rounded bg-[#080808] text-white text-xs font-bold"
                              >
                                Save Changes
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingPostId(null)}
                                className="px-3 py-1 rounded border border-[#D1D5DB] text-xs text-[#666666]"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-[#080808]">
                                  {post.title || 'Community Update'}
                                </span>
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white border border-[#D1D5DB]">
                                  {post.tag || post.type}
                                </span>
                              </div>
                              <p className="text-[#555555] line-clamp-2">{post.content}</p>
                              <div className="text-[10px] font-mono text-[#888888]">
                                By {post.authorName} • {post.createdAt} • {post.likes} Likes
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPostId(post.id);
                                  setEditPostTitle(post.title || '');
                                  setEditPostContent(post.content);
                                }}
                                className="p-1.5 rounded-lg border border-[#D1D5DB] bg-white hover:bg-[#F3F4F6] text-[#080808] cursor-pointer"
                                title="Edit post"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (window.confirm('Delete this community post?')) {
                                    deleteCommunityPost(post.id);
                                  }
                                }}
                                className="p-1.5 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] hover:bg-[#DC2626] hover:text-white text-[#DC2626] transition-colors cursor-pointer"
                                title="Delete post"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
