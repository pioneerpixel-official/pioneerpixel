import React, { useState } from 'react';
import {
  Search,
  User,
  ArrowRight,
  Sparkles,
  Layers,
  Calendar,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
  LayoutList,
  LayoutGrid,
  Target,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { LinkedinIcon, GithubIcon } from '../common/SocialIcons';
import { useCommunity } from '../../hooks/useCommunity';
import type { StudentProfile } from '../../types/community';
import { PublicProfileModal } from './PublicProfileModal';

export const DashboardSection: React.FC = () => {
  const { students, groups, isAdmin, currentUser } = useCommunity();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [filterRole, setFilterRole] = useState<'all' | 'students' | 'admins'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;

  const filteredStudents = students.filter((s) => {
    const q = searchQuery.toLowerCase();
    const matchesName = s.name.toLowerCase().includes(q);
    const matchesBio = s.bio?.toLowerCase().includes(q) || false;
    const matchesSkill = s.skills.some((sk) => sk.name.toLowerCase().includes(q));
    const matchesRole =
      filterRole === 'all' ||
      (filterRole === 'admins' && s.role === 'admin') ||
      (filterRole === 'students' && s.role === 'student');
    return (matchesName || matchesBio || matchesSkill) && matchesRole;
  });

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // MS Excel Export Functionality
  const handleExportToExcel = () => {
    const headers = [
      'Student Name',
      'Role',
      'Skills and Experience',
      'Joined Groups',
      'Common Task Status',
      'Monthly Progress Percentage',
      'Monthly Learning Summary',
    ];

    const rows = filteredStudents.map((s) => {
      const skillsStr = s.skills.map((sk) => `${sk.name} [${sk.experience}]`).join('; ');
      const groupsStr = groups.filter((g) => s.joinedGroupIds.includes(g.id)).map((g) => g.name).join('; ');
      const canViewProgress = isAdmin || currentUser?.id === s.id;
      const progressPct = canViewProgress ? `${s.monthlyProgress.progressPercentage}%` : 'Private';
      const progressSummary = canViewProgress ? s.monthlyProgress.whatLearned : 'Protected for Privacy';

      return [
        `"${s.name.replace(/"/g, '""')}"`,
        `"${s.role}"`,
        `"${skillsStr.replace(/"/g, '""')}"`,
        `"${groupsStr.replace(/"/g, '""')}"`,
        `"${s.completedCommonTask ? 'Completed' : 'Pending'}"`,
        `"${progressPct}"`,
        `"${progressSummary.replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const todayStr = 'pioneerpixel_export';
    link.setAttribute('download', `pioneerpixel_student_directory_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="py-10 bg-[#FFFFFF] min-h-screen text-[#080808]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E5E7EB] mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3F4F6] border border-[#D1D5DB] text-[10px] font-mono uppercase tracking-wider text-[#080808] mb-3">
              <Sparkles className="w-3 h-3 text-[#080808]" />
              <span>Community Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#080808] tracking-tight">
              Registered Students Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-[#555555] mt-1">
              Structured database of students, their verified skills, group enrollments, and privacy-protected learning progress.
            </p>
          </div>

          {/* Action Row: Export to MS Excel & View Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* MS Excel Feature Export Button */}
            <button
              onClick={handleExportToExcel}
              type="button"
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#080808] text-white hover:bg-[#222222] text-xs font-mono font-bold transition-all shadow-xs cursor-pointer"
              title="Download full student directory as an MS Excel compatible CSV spreadsheet"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Export to MS Excel</span>
            </button>

            {/* View Mode Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-[#F3F4F6] border border-[#D1D5DB]">
              <button
                onClick={() => setViewMode('table')}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#FFFFFF] text-[#080808] font-bold shadow-xs'
                    : 'text-[#666666] hover:text-[#080808]'
                }`}
                title="Admin-Style Structured Table View"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin-Style Table</span>
              </button>
              <button
                onClick={() => setViewMode('grid')}
                type="button"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#FFFFFF] text-[#080808] font-bold shadow-xs'
                    : 'text-[#666666] hover:text-[#080808]'
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards Grid</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="w-full sm:w-96 relative">
            <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, bio, or skill..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] text-xs text-[#080808] placeholder-[#888888] focus:outline-none focus:border-[#080808] shadow-xs"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-[#666666] hover:text-[#080808]"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#666666]">Filter:</span>
            {(['all', 'students', 'admins'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => {
                  setFilterRole(mode);
                  setCurrentPage(1);
                }}
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all cursor-pointer border ${
                  filterRole === mode
                    ? 'bg-[#080808] text-white border-[#080808] font-bold'
                    : 'bg-[#F9FAFB] text-[#666666] border-[#E5E7EB] hover:text-[#080808]'
                }`}
              >
                {mode === 'all' ? 'All' : mode}
              </button>
            ))}
          </div>
        </div>

        {/* Total Students Counter & Privacy Notice */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono text-[#666666] mb-6">
          <span>Showing {filteredStudents.length} of {students.length} registered students</span>
          <span className="flex items-center gap-1.5 text-[#555555]">
            <Lock className="w-3.5 h-3.5 text-[#888888]" />
            <span>Monthly progress is private (visible only to student and Admin)</span>
          </span>
        </div>

        {/* 1. ADMIN-STYLE STRUCTURED TABLE VIEW */}
        {viewMode === 'table' ? (
          <div className="rounded-3xl bg-[#FFFFFF] border border-[#E5E7EB] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F9FAFB] text-[#666666] font-mono uppercase text-[10px] border-b border-[#E5E7EB]">
                  <tr>
                    <th className="py-3.5 px-4 font-semibold">Student</th>
                    <th className="py-3.5 px-4 font-semibold">Role</th>
                    <th className="py-3.5 px-4 font-semibold">Current Skills</th>
                    <th className="py-3.5 px-4 font-semibold">Joined Groups</th>
                    <th className="py-3.5 px-4 font-semibold">Common Task</th>
                    <th className="py-3.5 px-4 font-semibold">Monthly Progress</th>
                    <th className="py-3.5 px-4 text-right font-semibold">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB]">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-[#888888] font-mono">
                        No students found matching your search.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((student) => {
                      const studentGroupNames = groups
                        .filter((g) => student.joinedGroupIds.includes(g.id))
                        .map((g) => g.name);

                      const canViewProgress = isAdmin || (currentUser && currentUser.id === student.id);

                      return (
                        <tr
                          key={student.id}
                          className="hover:bg-[#F9FAFB] transition-colors group"
                        >
                          {/* Student Info */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#080808] overflow-hidden shrink-0">
                                {student.avatar ? (
                                  <img
                                    src={student.avatar}
                                    alt={student.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="w-4 h-4 text-[#888888]" />
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-[#080808] whitespace-nowrap flex items-center gap-1.5">
                                  <span>{student.name}</span>
                                  {student.linkedinUrl && (
                                    <a
                                      href={student.linkedinUrl.startsWith('http') ? student.linkedinUrl : `https://${student.linkedinUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="LinkedIn Profile"
                                      className="text-[#0A66C2] hover:opacity-80"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <LinkedinIcon className="w-3 h-3" />
                                    </a>
                                  )}
                                  {student.githubUrl && (
                                    <a
                                      href={student.githubUrl.startsWith('http') ? student.githubUrl : `https://${student.githubUrl}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="GitHub Profile"
                                      className="text-[#080808] hover:opacity-80"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <GithubIcon className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                                <div className="text-[10px] text-[#888888] font-mono">
                                  Joined {student.joinedDate}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Role */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`text-[9px] font-mono uppercase px-2 py-0.5 rounded font-bold border ${
                                student.role === 'admin'
                                  ? 'bg-[#080808] text-white border-[#080808]'
                                  : 'bg-[#F3F4F6] text-[#555555] border-[#D1D5DB]'
                              }`}
                            >
                              {student.role}
                            </span>
                          </td>

                          {/* Skills Badges (1-2 skills + [ ...... ]) */}
                          <td className="py-3.5 px-4 max-w-[190px]">
                            {student.skills && student.skills.length > 0 ? (
                              <div className="flex flex-wrap items-center gap-1">
                                {student.skills.slice(0, 2).map((sk) => {
                                  const isLong = sk.name.length > 14;
                                  const displayName = isLong ? `${sk.name.slice(0, 14)}...` : sk.name;
                                  return (
                                    <span
                                      key={sk.id}
                                      title={sk.name}
                                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#FFFFFF] border border-[#D1D5DB] text-[#080808] max-w-[110px] truncate inline-block"
                                    >
                                      {displayName}
                                    </span>
                                  );
                                })}
                                {(student.skills.length > 2 || student.skills.some((sk) => sk.name.length > 14)) && (
                                  <span
                                    className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#666666] font-bold"
                                    title="View full profile to see all skills"
                                  >
                                    [ ...... ]
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[10px] font-mono text-[#888888]">No skills</span>
                            )}
                          </td>

                          {/* Skill Groups */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <div className="text-[11px] font-mono text-[#555555]">
                              {studentGroupNames.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {studentGroupNames.map((gn, idx) => (
                                    <span
                                      key={idx}
                                      className="px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#080808] text-[10px]"
                                    >
                                      {gn}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-[#888888]">None</span>
                              )}
                            </div>
                          </td>

                          {/* Common Task Status */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {student.completedCommonTask ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[#080808] text-white font-semibold shadow-xs">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                                Done
                              </span>
                            ) : (
                              <span className="text-[10px] font-mono text-[#888888]">Pending</span>
                            )}
                          </td>

                          {/* Monthly Progress (Privacy Check: Admin & Owner Only) */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            {canViewProgress ? (
                              <div className="w-36">
                                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                                  <span className="text-[#555555]">{student.monthlyProgress.month.split(' ')[0]}</span>
                                  <span className="font-bold text-[#080808]">{student.monthlyProgress.progressPercentage}%</span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden">
                                  <div
                                    className="h-full bg-[#080808] rounded-full transition-all duration-300"
                                    style={{ width: `${student.monthlyProgress.progressPercentage}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[#F3F4F6] border border-[#E5E7EB] text-[10px] font-mono text-[#666666]">
                                <Lock className="w-3 h-3 text-[#888888]" />
                                <span>Private</span>
                              </div>
                            )}
                          </td>

                          {/* Profile Modal Trigger */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedStudent(student)}
                              type="button"
                              className="px-2.5 py-1 rounded-lg bg-[#FFFFFF] hover:bg-[#080808] hover:text-white text-[11px] font-mono text-[#080808] border border-[#D1D5DB] transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              <span>View</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* 2. ALTERNATIVE CARD GRID VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedStudents.map((student) => {
              const studentGroupNames = groups
                .filter((g) => student.joinedGroupIds.includes(g.id))
                .map((g) => g.name);

              const canViewProgress = isAdmin || (currentUser && currentUser.id === student.id);

              return (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className="group rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#080808] p-6 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:-translate-y-0.5 shadow-xs hover:shadow-md"
                >
                  <div>
                    {/* Top Meta */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#F3F4F6] border border-[#E5E7EB] flex items-center justify-center text-[#080808] overflow-hidden shrink-0">
                          {student.avatar ? (
                            <img
                              src={student.avatar}
                              alt={student.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-6 h-6 text-[#888888]" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-[#080808] group-hover:text-black transition-colors">
                              {student.name}
                            </h3>
                          </div>
                          <span
                            className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded border ${
                              student.role === 'admin'
                                ? 'bg-[#080808] text-white font-bold border-[#080808]'
                                : 'bg-[#F3F4F6] text-[#555555] border-[#D1D5DB]'
                            }`}
                          >
                            {student.role === 'admin' ? 'Community Admin' : 'Student'}
                          </span>
                        </div>
                      </div>

                      {student.completedCommonTask && (
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#080808] text-white font-semibold flex items-center gap-1 shadow-xs"
                          title="Completed Common Task"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Task Done
                        </span>
                      )}
                    </div>

                    {/* Bio */}
                    <p className="text-xs text-[#555555] leading-relaxed mb-3 line-clamp-2">
                      {student.bio || 'Active student member of the Skill Community.'}
                    </p>

                    {/* Social & Portfolio Links */}
                    {(student.linkedinUrl || student.githubUrl) && (
                      <div className="flex items-center gap-2.5 mb-3">
                        {student.linkedinUrl && (
                          <a
                            href={student.linkedinUrl.startsWith('http') ? student.linkedinUrl : `https://${student.linkedinUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-[#0A66C2] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <LinkedinIcon className="w-3 h-3" />
                            <span>LinkedIn</span>
                          </a>
                        )}
                        {student.githubUrl && (
                          <a
                            href={student.githubUrl.startsWith('http') ? student.githubUrl : `https://${student.githubUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-[#080808] hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <GithubIcon className="w-3 h-3" />
                            <span>GitHub</span>
                          </a>
                        )}
                      </div>
                    )}

                    {/* Short Term Goal Snippet */}
                    {student.shortTermGoal && (
                      <div className="p-2.5 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] text-xs text-[#444444] mb-3">
                        <span className="text-[10px] font-mono font-bold text-[#080808] flex items-center gap-1 mb-0.5">
                          <Target className="w-3 h-3" />
                          <span>Goal:</span>
                        </span>
                        <p className="line-clamp-2 leading-relaxed text-[11px]">{student.shortTermGoal}</p>
                      </div>
                    )}

                    {/* Skills Section */}
                    <div className="mb-4">
                      <div className="text-[10px] uppercase font-mono text-[#666666] font-semibold mb-2">
                        Skills & Experience:
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {student.skills && student.skills.length > 0 ? (
                          <>
                            {student.skills.slice(0, 2).map((sk) => {
                              const isLong = sk.name.length > 16;
                              const displayName = isLong ? `${sk.name.slice(0, 16)}...` : sk.name;
                              return (
                                <span
                                  key={sk.id}
                                  title={sk.name}
                                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#F9FAFB] border border-[#E5E7EB] text-[#080808] max-w-[140px] truncate"
                                >
                                  {displayName}
                                  {sk.experience && <span className="text-[#666666] ml-1">({sk.experience})</span>}
                                </span>
                              );
                            })}
                            {(student.skills.length > 2 || student.skills.some((sk) => sk.name.length > 16)) && (
                              <span
                                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F3F4F6] text-[#666666] font-bold"
                                title="View full profile to see all skills"
                              >
                                [ ...... ]
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] font-mono text-[#888888]">No skills added yet</span>
                        )}
                      </div>
                    </div>

                    {/* Monthly Learning Progress (Privacy Check) */}
                    {canViewProgress ? (
                      <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] mb-4">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className="text-[10px] font-mono uppercase text-[#666666] font-semibold flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>Monthly Progress ({student.monthlyProgress.month})</span>
                          </span>
                          <span className="font-mono font-bold text-[#080808] text-xs">
                            {student.monthlyProgress.progressPercentage}%
                          </span>
                        </div>

                        <div className="w-full h-1.5 rounded-full bg-[#E5E7EB] overflow-hidden mb-2">
                          <div
                            className="h-full bg-[#080808] rounded-full transition-all duration-300"
                            style={{ width: `${student.monthlyProgress.progressPercentage}%` }}
                          />
                        </div>

                        <div className="text-[11px] text-[#555555] truncate">
                          {student.monthlyProgress.whatLearned || 'Making steady progress this month.'}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-[#666666]">
                          <Lock className="w-3.5 h-3.5 text-[#888888]" />
                          <span>Monthly progress is private</span>
                        </div>
                        <span className="text-[9px] font-mono uppercase text-[#888888]">Protected</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Row */}
                  <div className="pt-3 border-t border-[#E5E7EB] flex items-center justify-between text-xs">
                    <div className="text-[10px] font-mono text-[#666666] flex items-center gap-1">
                      <Layers className="w-3 h-3 text-[#888888]" />
                      <span>
                        {studentGroupNames.length > 0
                          ? studentGroupNames.join(', ')
                          : 'No groups joined'}
                      </span>
                    </div>

                    <span className="font-semibold text-[#080808] group-hover:underline flex items-center gap-1">
                      <span>View Profile</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls for 100+ Students */}
        {filteredStudents.length > pageSize && (
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-xs text-xs">
            <div className="font-mono text-[#666666]">
              Showing <span className="font-bold text-[#080808]">{(currentPage - 1) * pageSize + 1}</span>–<span className="font-bold text-[#080808]">{Math.min(currentPage * pageSize, filteredStudents.length)}</span> of <span className="font-bold text-[#080808]">{filteredStudents.length}</span> students
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#080808] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold cursor-pointer shadow-xs transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Prev</span>
              </button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                  if (totalPages > 7 && Math.abs(pg - currentPage) > 2 && pg !== 1 && pg !== totalPages) {
                    if (Math.abs(pg - currentPage) === 3) {
                      return <span key={pg} className="px-1 text-[#888888]">...</span>;
                    }
                    return null;
                  }
                  return (
                    <button
                      key={pg}
                      type="button"
                      onClick={() => setCurrentPage(pg)}
                      className={`w-7 h-7 rounded-lg font-mono text-xs font-bold transition-colors cursor-pointer ${
                        currentPage === pg
                          ? 'bg-[#080808] text-white shadow-xs'
                          : 'bg-white border border-[#E5E7EB] text-[#555555] hover:bg-[#F3F4F6]'
                      }`}
                    >
                      {pg}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#D1D5DB] bg-white text-[#080808] hover:bg-[#F3F4F6] disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 font-semibold cursor-pointer shadow-xs transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Selected Student Public Profile Modal */}
        {selectedStudent && (
          <PublicProfileModal
            student={selectedStudent}
            onClose={() => setSelectedStudent(null)}
          />
        )}
      </div>
    </div>
  );
};
