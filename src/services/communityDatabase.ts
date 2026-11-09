import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type {
  StudentProfile,
  SkillGroup,
  CommonTask,
  UploadRequest,
  CommunityPost,
} from '../types/community';

export function mapDbStudentToProfile(row: any): StudentProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role as 'student' | 'admin',
    status: (row.status as 'active' | 'suspended') || 'active',
    bio: row.bio || '',
    avatar: row.avatar || '',
    linkedinUrl: row.linkedin_url || '',
    githubUrl: row.github_url || '',
    shortTermGoal: row.short_term_goal || '',
    toolsExperience: row.tools_experience || '',
    extraCurricularSkills: row.extra_curricular_skills || '',
    skills: Array.isArray(row.skills) ? row.skills : [],
    monthlyProgress: row.monthly_progress || {
      month: 'November 2026',
      skillsLearned: [],
      whatLearned: '',
      progressPercentage: 0,
      currentlyLearning: [],
      updatedAt: 'Just now',
    },
    joinedGroupIds: row.joined_group_ids || [],
    completedCommonTask: Boolean(row.completed_common_task),
    joinedDate: row.joined_date || 'Recent',
    quizScore: row.quiz_score || 0,
    quizzesCompleted: row.quizzes_completed || 0,
    phone: row.phone,
    collegeId: row.college_id,
  };
}

export function mapProfileToDbRow(profile: StudentProfile): any {
  return {
    id: profile.id,
    name: profile.name,
    email: profile.email.toLowerCase().trim(),
    password: profile.password,
    role: profile.role,
    status: profile.status,
    bio: profile.bio || '',
    avatar: profile.avatar || '',
    linkedin_url: profile.linkedinUrl || '',
    github_url: profile.githubUrl || '',
    short_term_goal: profile.shortTermGoal || '',
    tools_experience: profile.toolsExperience || '',
    extra_curricular_skills: profile.extraCurricularSkills || '',
    skills: profile.skills || [],
    monthly_progress: profile.monthlyProgress,
    joined_group_ids: profile.joinedGroupIds || [],
    completed_common_task: profile.completedCommonTask,
    joined_date: profile.joinedDate,
    quiz_score: profile.quizScore || 0,
    quizzes_completed: profile.quizzesCompleted || 0,
    updated_at: new Date().toISOString(),
  };
}

// Fetch all students from Cloud DB
export async function fetchStudentsFromCloud(): Promise<StudentProfile[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching students from Supabase:', error);
      return null;
    }
    return (data || []).map(mapDbStudentToProfile);
  } catch (err) {
    console.warn('Supabase network error fetching students:', err);
    return null;
  }
}

// Upsert student profile in Cloud DB
export async function syncStudentToCloud(student: StudentProfile): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const row = mapProfileToDbRow(student);
    const { error } = await supabase.from('students').upsert(row, { onConflict: 'id' });
    if (error) {
      console.warn('Error syncing student to Supabase:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase network error syncing student:', err);
    return false;
  }
}

// Delete student permanently from Cloud DB
export async function deleteStudentFromCloud(studentId: string, email?: string): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error: idErr } = await supabase.from('students').delete().eq('id', studentId);
    if (email) {
      await supabase.from('students').delete().eq('email', email.toLowerCase().trim());
    }
    // Also remove any pending upload requests from this student
    await supabase.from('upload_requests').delete().eq('student_id', studentId);

    if (idErr) {
      console.warn('Error deleting student from Supabase:', idErr);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Supabase network error deleting student:', err);
    return false;
  }
}

// Fetch Skill Groups from Cloud DB
export async function fetchSkillGroupsFromCloud(): Promise<SkillGroup[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('skill_groups').select('*').order('created_at', { ascending: true });
    if (error) {
      console.warn('Error fetching groups from Supabase:', error);
      return null;
    }
    return (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      category: row.category,
      adminName: row.admin_name,
      adminId: row.admin_id,
      memberIds: row.member_ids || [],
      resources: row.resources || [],
    }));
  } catch (err) {
    console.warn('Supabase error fetching skill groups:', err);
    return null;
  }
}

// Upsert Skill Group in Cloud DB
export async function syncSkillGroupToCloud(group: SkillGroup): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('skill_groups').upsert({
      id: group.id,
      name: group.name,
      description: group.description,
      category: group.category,
      admin_name: group.adminName,
      admin_id: group.adminId,
      member_ids: group.memberIds,
      resources: group.resources,
    }, { onConflict: 'id' });
    return !error;
  } catch (err) {
    console.warn('Supabase error syncing skill group:', err);
    return false;
  }
}

// Fetch Common Task from Cloud DB
export async function fetchCommonTaskFromCloud(): Promise<CommonTask | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('common_tasks').select('*').limit(1).single();
    if (error || !data) return null;
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      deadline: data.deadline,
      requirements: data.requirements || [],
      assignedBy: data.assigned_by,
      updatedAt: data.updated_at,
    };
  } catch {
    return null;
  }
}

// Upsert Common Task in Cloud DB
export async function syncCommonTaskToCloud(task: CommonTask): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('common_tasks').upsert({
      id: task.id || 'current-common-task',
      title: task.title,
      description: task.description,
      deadline: task.deadline,
      requirements: task.requirements,
      assigned_by: task.assignedBy,
      updated_at: task.updatedAt,
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

// Fetch Community Posts from Cloud DB
export async function fetchCommunityPostsFromCloud(): Promise<CommunityPost[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('community_posts').select('*').order('created_at', { ascending: false });
    if (error) return null;
    return (data || []).map((row: any) => ({
      id: row.id,
      authorName: row.author_name,
      authorRole: row.author_role,
      title: row.title,
      content: row.content,
      type: row.type,
      mediaUrl: row.media_url,
      likes: row.likes || 0,
      likedBy: row.liked_by || [],
      createdAt: row.created_at,
    }));
  } catch {
    return null;
  }
}

// Upsert Community Post in Cloud DB
export async function syncCommunityPostToCloud(post: CommunityPost): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('community_posts').upsert({
      id: post.id,
      author_name: post.authorName,
      author_role: post.authorRole,
      title: post.title,
      content: post.content,
      type: post.type,
      media_url: post.mediaUrl,
      likes: post.likes,
      liked_by: post.likedBy,
      created_at: post.createdAt,
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}

// Fetch Upload Requests from Cloud DB
export async function fetchUploadRequestsFromCloud(): Promise<UploadRequest[] | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  try {
    const { data, error } = await supabase.from('upload_requests').select('*').order('submitted_at', { ascending: false });
    if (error) return null;
    return (data || []).map((row: any) => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      studentEmail: row.student_email,
      type: row.type,
      title: row.title,
      content: row.content,
      mediaUrl: row.media_url,
      status: row.status,
      submittedAt: row.submitted_at,
    }));
  } catch {
    return null;
  }
}

// Upsert Upload Request in Cloud DB
export async function syncUploadRequestToCloud(req: UploadRequest): Promise<boolean> {
  if (!isSupabaseConfigured || !supabase) return false;
  try {
    const { error } = await supabase.from('upload_requests').upsert({
      id: req.id,
      student_id: req.studentId,
      student_name: req.studentName,
      student_email: req.studentEmail,
      type: req.type,
      title: req.title,
      content: req.content,
      media_url: req.mediaUrl,
      status: req.status,
      submitted_at: req.submittedAt,
    }, { onConflict: 'id' });
    return !error;
  } catch {
    return false;
  }
}
