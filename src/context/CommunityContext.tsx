/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect } from 'react';
import type {
  StudentProfile,
  SkillGroup,
  CommonTask,
  ArchivedTask,
  UploadRequest,
  CommunityPost,
  StudentSkill,
  MonthlyProgress,
  GroupResource,
} from '../types/community';
import {
  HOST_ADMIN,
  SEED_STUDENTS,
  SEED_GROUPS,
  SEED_COMMON_TASK,
  SEED_PREVIOUS_TASKS,
  SEED_UPLOAD_REQUESTS,
  SEED_COMMUNITY_POSTS,
} from '../data/communitySeed';
import { CommunityContext } from './CommunityContextInstance';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  fetchStudentsFromCloud,
  syncStudentToCloud,
  deleteStudentFromCloud,
  fetchSkillGroupsFromCloud,
  syncSkillGroupToCloud,
  fetchCommonTaskFromCloud,
  syncCommonTaskToCloud,
  fetchCommunityPostsFromCloud,
  syncCommunityPostToCloud,
  fetchUploadRequestsFromCloud,
  syncUploadRequestToCloud,
  mapDbStudentToProfile,
} from '../services/communityDatabase';

const STORAGE_KEY = 'pioneerpixel_clean_v6';

function safeSetItem(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch (e: any) {
    if (e?.name === 'QuotaExceededError' || e?.code === 22) {
      console.warn('Storage quota limit reached. Clearing temporary legacy cache...');
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && !k.startsWith(STORAGE_KEY)) {
            localStorage.removeItem(k);
          }
        }
        localStorage.setItem(key, value);
      } catch (retryErr) {
        console.error('Storage retry failed', retryErr);
      }
    } else {
      console.warn(`Failed to set item ${key}`, e);
    }
  }
}

// Run immediate purge of any legacy storage keys from previous sessions before initializing state
if (typeof window !== 'undefined') {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && (k.startsWith('student_skill_community') || k.startsWith('pioneerpixel')) && !k.startsWith(STORAGE_KEY)) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    console.warn('Could not clean legacy storage', e);
  }
}

export const HOST_ADMIN_EMAIL = 'arsalansahil02@gmail.com';

// Automatically calculate monthly progress based on student's actual platform activities
export function calculateStudentAutoProgress(student: {
  bio?: string;
  shortTermGoal?: string;
  toolsExperience?: string;
  skills?: Array<any>;
  joinedGroupIds?: string[];
  completedCommonTask?: boolean;
  quizzesCompleted?: number;
  quizScore?: number;
  monthlyProgress?: MonthlyProgress;
}): number {
  let score = 0;

  // 1. Profile Details (Bio / Goals / Tools) - Up to 20%
  if (student.bio && student.bio.trim().length > 0) score += 10;
  if (
    (student.shortTermGoal && student.shortTermGoal.trim().length > 0) ||
    (student.toolsExperience && student.toolsExperience.trim().length > 0)
  ) {
    score += 10;
  }

  // 2. Skills Portfolio (5% per skill, up to 25%)
  const skillCount = student.skills?.length || 0;
  score += Math.min(25, skillCount * 5);

  // 3. Joined Skill Groups (12.5% per group, up to 25%)
  const groupCount = student.joinedGroupIds?.length || 0;
  score += Math.min(25, Math.round(groupCount * 12.5));

  // 4. Weekly Common Task Challenge (20%)
  if (student.completedCommonTask) {
    score += 20;
  }

  // 5. Quizzes / Assessments (10%)
  if (
    (student.quizzesCompleted && student.quizzesCompleted > 0) ||
    (student.quizScore && student.quizScore > 0)
  ) {
    score += 10;
  }

  return Math.min(100, Math.round(score));
}

export const CommunityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {

  // Load state from localStorage or use initial clean empty state
  const [students, setStudents] = useState<StudentProfile[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_students`);
      if (stored) {
        const parsed: StudentProfile[] = JSON.parse(stored);
        // Purge legacy pioneerpixel admin and ensure arsalansahil02@gmail.com is configured as host admin with reset progress
        const sanitized = parsed
          .filter((s) => s.email.toLowerCase() !== 'admin@pioneerpixel.com' && s.email.toLowerCase() !== 'arsalansahil@gmail.com')
          .map((s) => {
            if (s.id === 'pioneerpixel-host-admin' || s.email.toLowerCase() === HOST_ADMIN_EMAIL) {
              return {
                ...s,
                id: 'pioneerpixel-host-admin',
                name: s.name === 'PioneerPixel Admin' ? 'Arsalan Sahil' : s.name,
                email: HOST_ADMIN_EMAIL,
                role: 'admin' as const,
                quizScore: 0,
                quizzesCompleted: 0,
                completedCommonTask: false,
                skills: [],
                monthlyProgress: {
                  ...s.monthlyProgress,
                  progressPercentage: 0,
                  whatLearned: '',
                  skillsLearned: [],
                },
              };
            }
            return s;
          });

        if (!sanitized.some((s) => s.email.toLowerCase() === HOST_ADMIN_EMAIL)) {
          sanitized.unshift(HOST_ADMIN);
        }
        return sanitized;
      }
    } catch (e) {
      console.warn('Failed to read students from storage', e);
    }
    return SEED_STUDENTS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_current_user`);
      if (stored) return stored;
    } catch (e) {
      console.warn('Failed to read current user from storage', e);
    }
    return '';
  });

  const [groups, setGroups] = useState<SkillGroup[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_groups`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to read groups from storage', e);
    }
    return SEED_GROUPS;
  });

  const [commonTask, setCommonTask] = useState<CommonTask>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_common_task`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to read common task from storage', e);
    }
    return SEED_COMMON_TASK;
  });

  const [previousTasks, setPreviousTasks] = useState<ArchivedTask[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_previous_tasks`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to read previous tasks from storage', e);
    }
    return SEED_PREVIOUS_TASKS;
  });

  const [uploadRequests, setUploadRequests] = useState<UploadRequest[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_upload_requests`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to read upload requests from storage', e);
    }
    return SEED_UPLOAD_REQUESTS;
  });

  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>(() => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY}_community_posts`);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to read community posts from storage', e);
    }
    return SEED_COMMUNITY_POSTS;
  });

  // Save to localStorage when state changes safely with quota protection
  useEffect(() => {
    safeSetItem(`${STORAGE_KEY}_students`, JSON.stringify(students));
    safeSetItem(`${STORAGE_KEY}_current_user`, currentUserId);
    safeSetItem(`${STORAGE_KEY}_groups`, JSON.stringify(groups));
    safeSetItem(`${STORAGE_KEY}_common_task`, JSON.stringify(commonTask));
    safeSetItem(`${STORAGE_KEY}_previous_tasks`, JSON.stringify(previousTasks));
    safeSetItem(`${STORAGE_KEY}_upload_requests`, JSON.stringify(uploadRequests));
    safeSetItem(`${STORAGE_KEY}_community_posts`, JSON.stringify(communityPosts));
  }, [students, currentUserId, groups, commonTask, previousTasks, uploadRequests, communityPosts]);

  // Initial Cloud Data Fetch & Realtime Synchronizer
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    // 1. Initial Cloud Sync: Fetch live students
    fetchStudentsFromCloud().then((cloudStudents) => {
      if (cloudStudents && cloudStudents.length > 0) {
        let deletedIds: string[] = [];
        try {
          const storedDeleted = localStorage.getItem(`${STORAGE_KEY}_deleted_ids`);
          if (storedDeleted) deletedIds = JSON.parse(storedDeleted);
        } catch (e) {
          console.warn('Error reading deleted IDs', e);
        }

        // Clean out any users that were previously deleted by Host Admin
        const validStudents = cloudStudents.filter(
          (cs) =>
            !deletedIds.includes(cs.id) &&
            !deletedIds.includes(cs.email.toLowerCase())
        );

        // Ensure Host Admin is always preserved
        const hasHostAdmin = validStudents.some(
          (s) => s.id === 'pioneerpixel-host-admin' || s.email.toLowerCase() === HOST_ADMIN_EMAIL
        );
        const finalStudents = hasHostAdmin ? validStudents : [HOST_ADMIN, ...validStudents];

        setStudents(finalStudents);
      } else {
        // First time initialization in Cloud: upload host admin
        syncStudentToCloud(HOST_ADMIN);
        setStudents([HOST_ADMIN]);
      }
    });

    // Fetch live skill groups
    fetchSkillGroupsFromCloud().then((cloudGroups) => {
      if (cloudGroups && cloudGroups.length > 0) {
        setGroups(cloudGroups);
      }
    });

    // Fetch live common task
    fetchCommonTaskFromCloud().then((cloudTask) => {
      if (cloudTask && cloudTask.title) {
        setCommonTask(cloudTask);
      }
    });

    // Fetch live community posts
    fetchCommunityPostsFromCloud().then((cloudPosts) => {
      if (cloudPosts && cloudPosts.length > 0) {
        setCommunityPosts(cloudPosts);
      }
    });

    // Fetch live upload requests
    fetchUploadRequestsFromCloud().then((cloudReqs) => {
      if (cloudReqs && cloudReqs.length > 0) {
        setUploadRequests(cloudReqs);
      }
    });

    // 2. Realtime listener: Whenever another student signs up or updates on any device!
    const studentsChannel = supabase
      .channel('realtime:students')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'students' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newProfile = mapDbStudentToProfile(payload.new);
            setStudents((prev) => {
              if (prev.some((s) => s.id === newProfile.id || s.email.toLowerCase() === newProfile.email.toLowerCase())) {
                return prev.map((s) => (s.id === newProfile.id ? newProfile : s));
              }
              return [newProfile, ...prev];
            });
          } else if (payload.eventType === 'UPDATE') {
            const updatedProfile = mapDbStudentToProfile(payload.new);
            setStudents((prev) =>
              prev.map((s) => (s.id === updatedProfile.id ? updatedProfile : s))
            );
          } else if (payload.eventType === 'DELETE') {
            setStudents((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // 3. Realtime listener: Skill groups
    const groupsChannel = supabase
      .channel('realtime:skill_groups')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'skill_groups' },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newGrp: SkillGroup = {
              id: payload.new.id,
              name: payload.new.name,
              description: payload.new.description,
              category: payload.new.category,
              adminName: payload.new.admin_name,
              adminId: payload.new.admin_id,
              memberIds: payload.new.member_ids || [],
              resources: payload.new.resources || [],
            };
            setGroups((prev) => (prev.some((g) => g.id === newGrp.id) ? prev : [...prev, newGrp]));
          } else if (payload.eventType === 'UPDATE') {
            setGroups((prev) =>
              prev.map((g) =>
                g.id === payload.new.id
                  ? {
                      ...g,
                      name: payload.new.name,
                      description: payload.new.description,
                      category: payload.new.category,
                      adminName: payload.new.admin_name,
                      adminId: payload.new.admin_id,
                      memberIds: payload.new.member_ids || [],
                      resources: payload.new.resources || [],
                    }
                  : g
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setGroups((prev) => prev.filter((g) => g.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(studentsChannel);
      supabase?.removeChannel(groupsChannel);
    };
  }, []);

  const currentUser = students.find((s) => s.id === currentUserId) || null;
  const isAdmin = currentUser?.role === 'admin';
  const isHostAdmin =
    currentUser?.id === 'pioneerpixel-host-admin' ||
    currentUser?.email?.toLowerCase() === HOST_ADMIN_EMAIL;

  // Auth functions
  const login = (email: string, password?: string) => {
    const trimmed = email.trim().toLowerCase();
    const enteredPassword = password?.trim() || '';

    if (!enteredPassword) {
      return { success: false, error: 'Password is required to sign in.' };
    }

    const found = students.find((s) => s.email.toLowerCase() === trimmed);
    if (!found) {
      // If the website owner logs in before signing up, automatically provision as admin
      if (trimmed === HOST_ADMIN_EMAIL) {
        if (enteredPassword !== 'admin' && enteredPassword !== HOST_ADMIN.password) {
          return { success: false, error: 'Incorrect password for Admin.' };
        }
        const ownerAdmin: StudentProfile = {
          ...HOST_ADMIN,
          password: enteredPassword,
        };
        setStudents((prev) => [ownerAdmin, ...prev.filter((p) => p.email.toLowerCase() !== trimmed)]);
        setCurrentUserId(ownerAdmin.id);
        return { success: true };
      }
      return { success: false, error: 'Account not found with this email. Please check or sign up.' };
    }

    // Verify password strictly or set it if user originally signed up without password
    if (!found.password) {
      const updated = { ...found, password: enteredPassword };
      setStudents((prev) => prev.map((s) => (s.id === found.id ? updated : s)));
      syncStudentToCloud(updated);
    } else if (found.password !== enteredPassword) {
      return { success: false, error: 'Incorrect password. Please try again or use Forgot Password.' };
    }
    setCurrentUserId(found.id);
    return { success: true };
  };

  const signup = (
    name: string,
    email: string,
    password?: string
  ) => {
    const trimmedEmail = email.trim().toLowerCase();
    const isOwnerHost = trimmedEmail === HOST_ADMIN_EMAIL;
    const existing = students.find((s) => s.email.toLowerCase() === trimmedEmail);

    if (existing) {
      // If the website owner signs up, update their password and name, and keep as Host Admin
      if (isOwnerHost) {
        setStudents((prev) =>
          prev.map((s) =>
            s.email.toLowerCase() === trimmedEmail
              ? {
                  ...s,
                  name: name.trim() || s.name,
                  password: password?.trim() || s.password,
                  role: 'admin',
                }
              : s
          )
        );
        setCurrentUserId(existing.id);
        return { success: true };
      }
      return { success: false, error: 'An account with this email already exists. Please log in.' };
    }

    // Normal registrations are students. Website host is ALWAYS Root Admin!
    const newStudent: StudentProfile = {
      id: isOwnerHost ? 'pioneerpixel-host-admin' : `user-${Date.now()}`,
      name: name.trim(),
      email: trimmedEmail,
      password: password?.trim() || undefined,
      role: isOwnerHost ? 'admin' : 'student',
      bio: '',
      linkedinUrl: '',
      githubUrl: '',
      shortTermGoal: '',
      toolsExperience: '',
      extraCurricularSkills: '',
      skills: [],
      monthlyProgress: {
        month: new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        skillsLearned: [],
        whatLearned: '',
        progressPercentage: 0,
        currentlyLearning: [],
        updatedAt: 'Just now',
      },
      joinedGroupIds: [],
      completedCommonTask: false,
      joinedDate: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
      quizScore: 0,
      quizzesCompleted: 0,
      status: 'active',
    };

    setStudents((prev) => [newStudent, ...prev]);
    setCurrentUserId(newStudent.id);
    syncStudentToCloud(newStudent);
    return { success: true };
  };

  const resetPassword = (email: string, newPassword: string): { success: boolean; error?: string } => {
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPassword = newPassword.trim();

    if (!trimmedEmail) {
      return { success: false, error: 'Please enter your registered email address.' };
    }

    if (!cleanPassword || cleanPassword.length < 4) {
      return { success: false, error: 'New password must be at least 4 characters long.' };
    }

    const found = students.find((s) => s.email.toLowerCase() === trimmedEmail);
    if (!found) {
      // Check if it is the host admin email
      if (trimmedEmail === HOST_ADMIN_EMAIL) {
        const updatedAdmin: StudentProfile = {
          ...HOST_ADMIN,
          password: cleanPassword,
        };
        setStudents((prev) => [updatedAdmin, ...prev.filter((p) => p.email.toLowerCase() !== trimmedEmail)]);
        setCurrentUserId(updatedAdmin.id);
        syncStudentToCloud(updatedAdmin);
        return { success: true };
      }
      return { success: false, error: 'No account found with this email address. Please register.' };
    }

    const updatedUser: StudentProfile = {
      ...found,
      password: cleanPassword,
    };

    setStudents((prev) =>
      prev.map((s) => (s.id === found.id ? updatedUser : s))
    );
    setCurrentUserId(updatedUser.id);
    syncStudentToCloud(updatedUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUserId('');
  };

  const switchUser = (userId: string) => {
    const found = students.find((s) => s.id === userId);
    if (found) {
      setCurrentUserId(found.id);
    }
  };

  // Profile operations
  const updateProfile = (updated: Partial<StudentProfile>) => {
    if (!currentUser) return;
    const base = { ...currentUser, ...updated };
    const autoProgress = calculateStudentAutoProgress(base);
    const merged: StudentProfile = {
      ...base,
      monthlyProgress: {
        ...base.monthlyProgress,
        progressPercentage: autoProgress,
      },
    };
    setStudents((prev) =>
      prev.map((s) => (s.id === currentUser.id ? merged : s))
    );
    syncStudentToCloud(merged);
  };

  const addSkill = (skill: Omit<StudentSkill, 'id'>) => {
    if (!currentUser) return;
    const newSkill: StudentSkill = {
      ...skill,
      id: `sk-${Date.now()}`,
    };
    const nextSkills = [...currentUser.skills, newSkill];
    const base = { ...currentUser, skills: nextSkills };
    const autoProgress = calculateStudentAutoProgress(base);
    const updatedUser: StudentProfile = {
      ...base,
      monthlyProgress: {
        ...base.monthlyProgress,
        progressPercentage: autoProgress,
      },
    };
    setStudents((prev) =>
      prev.map((s) => (s.id === currentUser.id ? updatedUser : s))
    );
    syncStudentToCloud(updatedUser);
  };

  const updateSkill = (skillId: string, updated: Partial<StudentSkill>) => {
    if (!currentUser) return;
    const updatedSkills = currentUser.skills.map((sk) =>
      sk.id === skillId ? { ...sk, ...updated } : sk
    );
    const base = { ...currentUser, skills: updatedSkills };
    const autoProgress = calculateStudentAutoProgress(base);
    const updatedUser: StudentProfile = {
      ...base,
      monthlyProgress: {
        ...base.monthlyProgress,
        progressPercentage: autoProgress,
      },
    };
    setStudents((prev) =>
      prev.map((s) => (s.id === currentUser.id ? updatedUser : s))
    );
    syncStudentToCloud(updatedUser);
  };

  const removeSkill = (skillId: string) => {
    if (!currentUser) return;
    const nextSkills = currentUser.skills.filter((sk) => sk.id !== skillId);
    const base = { ...currentUser, skills: nextSkills };
    const autoProgress = calculateStudentAutoProgress(base);
    const updatedUser: StudentProfile = {
      ...base,
      monthlyProgress: {
        ...base.monthlyProgress,
        progressPercentage: autoProgress,
      },
    };
    setStudents((prev) =>
      prev.map((s) => (s.id === currentUser.id ? updatedUser : s))
    );
    syncStudentToCloud(updatedUser);
  };

  const updateMonthlyProgress = (progress: Partial<MonthlyProgress>) => {
    if (!currentUser) return;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== currentUser.id) return s;
        const updatedStudent: StudentProfile = {
          ...s,
          monthlyProgress: {
            ...s.monthlyProgress,
            ...progress,
            updatedAt: 'Just now',
          },
        };
        syncStudentToCloud(updatedStudent);
        return updatedStudent;
      })
    );
  };

  // Group operations (Enforcing 2 groups maximum rule)
  const joinGroup = (groupId: string): { success: boolean; error?: string } => {
    if (!currentUser) {
      return { success: false, error: 'Please sign in to join groups.' };
    }

    if (currentUser.joinedGroupIds.includes(groupId)) {
      return { success: false, error: 'You are already a member of this group.' };
    }

    // STRICT RULE: Max 2 groups at a time for students. Admin is exempt and can be in all groups!
    if (currentUser.role !== 'admin' && currentUser.joinedGroupIds.length >= 2) {
      return {
        success: false,
        error:
          'Group Limit Reached: A student can join a maximum of 2 groups at a time. Please leave one group before joining another.',
      };
    }

    const nextJoined = [...currentUser.joinedGroupIds, groupId];
    const base = { ...currentUser, joinedGroupIds: nextJoined };
    const autoProgress = calculateStudentAutoProgress(base);
    const updatedStudent: StudentProfile = {
      ...base,
      monthlyProgress: {
        ...base.monthlyProgress,
        progressPercentage: autoProgress,
      },
    };

    // Update student's joined groups
    setStudents((prev) => {
      const updated = prev.map((s) => (s.id === currentUser.id ? updatedStudent : s));
      syncStudentToCloud(updatedStudent);
      return updated;
    });

    // Update group's member list
    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        if (g.memberIds.includes(currentUser.id)) return g;
        const merged = { ...g, memberIds: [...g.memberIds, currentUser.id] };
        syncSkillGroupToCloud(merged);
        return merged;
      })
    );

    return { success: true };
  };

  const leaveGroup = (groupId: string) => {
    if (!currentUser) return;
    const nextJoined = currentUser.joinedGroupIds.filter((id) => id !== groupId);
    const base = { ...currentUser, joinedGroupIds: nextJoined };
    const autoProgress = calculateStudentAutoProgress(base);
    const updatedStudent: StudentProfile = {
      ...base,
      monthlyProgress: {
        ...base.monthlyProgress,
        progressPercentage: autoProgress,
      },
    };

    setStudents((prev) => {
      const updated = prev.map((s) => (s.id === currentUser.id ? updatedStudent : s));
      syncStudentToCloud(updatedStudent);
      return updated;
    });

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const merged = { ...g, memberIds: g.memberIds.filter((id) => id !== currentUser.id) };
        syncSkillGroupToCloud(merged);
        return merged;
      })
    );
  };

  const addGroupResource = (
    groupId: string,
    resource: { type: 'note' | 'image' | 'video'; title: string; content: string; mediaUrl?: string }
  ) => {
    if (!currentUser) {
      return { success: false, error: 'Must be logged in to share resources.' };
    }

    const isMember = currentUser.joinedGroupIds.includes(groupId);
    if (!isMember && currentUser.role !== 'admin') {
      return { success: false, error: 'Only group members can share content in this group.' };
    }

    const newResource: GroupResource = {
      id: `res-${Date.now()}`,
      groupId,
      type: resource.type,
      title: resource.title,
      content: resource.content,
      mediaUrl: resource.mediaUrl,
      authorName: currentUser.name,
      authorId: currentUser.id,
      createdAt: 'Just now',
    };

    setGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const merged = { ...g, resources: [newResource, ...g.resources] };
        syncSkillGroupToCloud(merged);
        return merged;
      })
    );

    return { success: true };
  };

  // Common Task operations
  const submitCommonTask = (text: string, link?: string) => {
    if (!currentUser) return;
    setStudents((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== currentUser.id) return s;
        const base = {
          ...s,
          completedCommonTask: true,
          commonTaskSubmission: {
            text: text.trim(),
            link: link?.trim(),
            submittedAt: 'Just now',
          },
        };
        const autoProgress = calculateStudentAutoProgress(base);
        const updatedStudent: StudentProfile = {
          ...base,
          monthlyProgress: {
            ...base.monthlyProgress,
            progressPercentage: autoProgress,
          },
        };
        syncStudentToCloud(updatedStudent);
        return updatedStudent;
      });
      return updated;
    });
  };

  const toggleCommonTaskCompletion = () => {
    if (!currentUser) return;
    setStudents((prev) => {
      const updated = prev.map((s) => {
        if (s.id !== currentUser.id) return s;
        const base = {
          ...s,
          completedCommonTask: !s.completedCommonTask,
        };
        const autoProgress = calculateStudentAutoProgress(base);
        const updatedStudent: StudentProfile = {
          ...base,
          monthlyProgress: {
            ...base.monthlyProgress,
            progressPercentage: autoProgress,
          },
        };
        syncStudentToCloud(updatedStudent);
        return updatedStudent;
      });
      return updated;
    });
  };

  const archiveCurrentTask = () => {
    const completedCount = students.filter((s) => s.completedCommonTask).length;
    const archived: ArchivedTask = {
      id: `arch-${Date.now()}`,
      title: commonTask.title,
      description: commonTask.description,
      deadline: commonTask.deadline,
      completedDate: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      requirements: [...commonTask.requirements],
      assignedBy: commonTask.assignedBy,
      submissionsCount: completedCount,
      status: 'completed',
    };
    setPreviousTasks((prev) => [archived, ...prev]);
  };

  // Student Upload Request operations
  const submitUploadRequest = (
    type: 'photo' | 'note' | 'text',
    title: string,
    content: string,
    mediaUrl?: string
  ) => {
    if (!currentUser) {
      return { success: false, message: 'Please log in to submit upload requests.' };
    }

    const newReq: UploadRequest = {
      id: `req-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      studentEmail: currentUser.email,
      type,
      title: title.trim(),
      content: content.trim(),
      mediaUrl: mediaUrl?.trim(),
      status: 'pending',
      submittedAt: 'Just now',
    };

    setUploadRequests((prev) => [newReq, ...prev]);
    syncUploadRequestToCloud(newReq);
    return {
      success: true,
      message: 'Upload request submitted to Main Admin! It will be reviewed before appearing on the public feed.',
    };
  };

  // Community Feed operations
  const likePost = (postId: string) => {
    if (!currentUser) return;
    setCommunityPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const alreadyLiked = post.likedBy.includes(currentUser.id);
        const updatedLikedBy = alreadyLiked
          ? post.likedBy.filter((id) => id !== currentUser.id)
          : [...post.likedBy, currentUser.id];
        const updatedPost = {
          ...post,
          likes: updatedLikedBy.length,
          likedBy: updatedLikedBy,
        };
        syncCommunityPostToCloud(updatedPost);
        return updatedPost;
      })
    );
  };

  // Admin Operations
  const approveUploadRequest = (requestId: string) => {
    const req = uploadRequests.find((r) => r.id === requestId);
    if (!req) return;

    // Create community post from approved upload request
    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: req.studentName,
      authorRole: 'Student via Admin',
      type: req.type === 'photo' ? 'image' : req.type,
      title: req.title,
      content: req.content,
      mediaUrl: req.mediaUrl,
      likes: 1,
      likedBy: [req.studentId],
      createdAt: 'Just now',
      tag: 'Student Showcase',
    };

    setCommunityPosts((prev) => [newPost, ...prev]);
    syncCommunityPostToCloud(newPost);

    // Mark request as approved
    const updatedReq: UploadRequest = { ...req, status: 'approved' };
    setUploadRequests((prev) =>
      prev.map((r) => (r.id === requestId ? updatedReq : r))
    );
    syncUploadRequestToCloud(updatedReq);
  };

  const rejectUploadRequest = (requestId: string, feedback?: string) => {
    setUploadRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const updatedReq: UploadRequest = { ...r, status: 'rejected', adminFeedback: feedback };
          syncUploadRequestToCloud(updatedReq);
          return updatedReq;
        }
        return r;
      })
    );
  };

  const createCommunityPost = (post: {
    type: 'image' | 'note' | 'text';
    title?: string;
    content: string;
    mediaUrl?: string;
    tag?: string;
  }) => {
    if (!currentUser || currentUser.role !== 'admin') return;

    const newPost: CommunityPost = {
      id: `post-${Date.now()}`,
      authorName: currentUser.name,
      authorRole: 'Main Admin',
      type: post.type,
      title: post.title,
      content: post.content,
      mediaUrl: post.mediaUrl,
      likes: 0,
      likedBy: [],
      createdAt: 'Just now',
      tag: post.tag || 'Official',
    };

    setCommunityPosts((prev) => [newPost, ...prev]);
    syncCommunityPostToCloud(newPost);
  };

  const updateCommonTask = (updated: Partial<CommonTask>) => {
    setCommonTask((prev) => {
      const merged = {
        ...prev,
        ...updated,
        updatedAt: 'Just now',
      };
      syncCommonTaskToCloud(merged);
      return merged;
    });
  };

  const recordQuizCompletion = (studentId: string, earnedPoints: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const currentScore = s.quizScore || 0;
          const currentCount = s.quizzesCompleted || 0;
          const base = {
            ...s,
            quizScore: currentScore + earnedPoints,
            quizzesCompleted: currentCount + 1,
          };
          const autoProgress = calculateStudentAutoProgress(base);
          const updatedStudent: StudentProfile = {
            ...base,
            monthlyProgress: {
              ...base.monthlyProgress,
              progressPercentage: autoProgress,
            },
          };
          syncStudentToCloud(updatedStudent);
          return updatedStudent;
        }
        return s;
      })
    );
  };

  const makeStudentAdmin = (studentId: string) => {
    if (!isHostAdmin) {
      alert('Permission denied. Only the Host Admin (Arsalan Sahil) can assign admin privileges.');
      return;
    }
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const updatedStudent = { ...s, role: 'admin' as const };
          syncStudentToCloud(updatedStudent);
          return updatedStudent;
        }
        return s;
      })
    );
  };

  const demoteAdminToStudent = (studentId: string) => {
    if (!isHostAdmin) {
      alert('Permission denied. Only the Host Admin (Arsalan Sahil) can remove admin privileges.');
      return;
    }
    const target = students.find((s) => s.id === studentId);
    if (studentId === 'pioneerpixel-host-admin' || target?.email.toLowerCase() === HOST_ADMIN_EMAIL) return;
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === studentId) {
          const updatedStudent = { ...s, role: 'student' as const };
          syncStudentToCloud(updatedStudent);
          return updatedStudent;
        }
        return s;
      })
    );
  };

  const createSkillGroup = (name: string, description: string, category: string, adminName: string) => {
    const adminId = currentUser?.id || 'pioneerpixel-host-admin';
    const newGroupId = `grp-${Date.now()}`;
    const newGroup: SkillGroup = {
      id: newGroupId,
      name: name.trim(),
      description: description.trim(),
      category: category.trim(),
      adminName: adminName.trim(),
      adminId: adminId,
      memberIds: [adminId],
      resources: [],
    };
    setGroups((prev) => [...prev, newGroup]);
    syncSkillGroupToCloud(newGroup);

    // Admin is automatically a joined member of every group they create
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === adminId) {
          return {
            ...s,
            joinedGroupIds: s.joinedGroupIds.includes(newGroupId)
              ? s.joinedGroupIds
              : [...s.joinedGroupIds, newGroupId],
          };
        }
        return s;
      })
    );
  };

  const updateSkillGroup = (groupId: string, updated: Partial<SkillGroup>) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, ...updated } : g))
    );
  };

  const deleteSkillGroup = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setStudents((prev) =>
      prev.map((s) => ({
        ...s,
        joinedGroupIds: s.joinedGroupIds.filter((id) => id !== groupId),
      }))
    );
  };

  const deleteCommunityPost = (postId: string) => {
    setCommunityPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const updateCommunityPost = (postId: string, updated: Partial<CommunityPost>) => {
    setCommunityPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, ...updated } : p))
    );
  };

  const deleteStudent = (studentId: string) => {
    // Only Host Admin (Arsalan Sahil) has permission to delete students
    if (!isHostAdmin) {
      alert('Permission denied. Only the Host Admin can delete students.');
      return;
    }

    const target = students.find((s) => s.id === studentId);
    if (studentId === 'pioneerpixel-host-admin' || target?.email.toLowerCase() === HOST_ADMIN_EMAIL) {
      return;
    }

    const targetEmail = target?.email.toLowerCase();

    // 1. Remove from state immediately
    setStudents((prev) =>
      prev.filter((s) => s.id !== studentId && s.email.toLowerCase() !== targetEmail)
    );

    // 2. Clear current user if they are the one deleted
    if (currentUserId === studentId) {
      setCurrentUserId('');
    }

    // 3. Remove student from all skill group memberships
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        memberIds: g.memberIds.filter((mid) => mid !== studentId),
      }))
    );

    // 4. Record deleted ID & email in localStorage to ensure they never resurrect
    try {
      const deletedKey = `${STORAGE_KEY}_deleted_ids`;
      const currentDeleted: string[] = JSON.parse(localStorage.getItem(deletedKey) || '[]');
      if (!currentDeleted.includes(studentId)) currentDeleted.push(studentId);
      if (targetEmail && !currentDeleted.includes(targetEmail)) currentDeleted.push(targetEmail);
      localStorage.setItem(deletedKey, JSON.stringify(currentDeleted));
    } catch (e) {
      console.warn('Error saving deleted ID to localStorage', e);
    }

    // 5. Permanently delete from Supabase Cloud Database
    deleteStudentFromCloud(studentId, targetEmail);
  };

  const resetToDefaults = () => {
    setStudents(SEED_STUDENTS);
    setCurrentUserId('pioneerpixel-host-admin');
    setGroups(SEED_GROUPS);
    setCommonTask(SEED_COMMON_TASK);
    setPreviousTasks(SEED_PREVIOUS_TASKS);
    setUploadRequests(SEED_UPLOAD_REQUESTS);
    setCommunityPosts(SEED_COMMUNITY_POSTS);
    try {
      localStorage.clear();
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <CommunityContext.Provider
      value={{
        currentUser,
        students,
        groups,
        commonTask,
        previousTasks,
        uploadRequests,
        communityPosts,
        isAdmin,
        isHostAdmin,
        login,
        signup,
        resetPassword,
        logout,
        switchUser,
        updateProfile,
        addSkill,
        updateSkill,
        removeSkill,
        updateMonthlyProgress,
        recordQuizCompletion,
        joinGroup,
        leaveGroup,
        addGroupResource,
        submitCommonTask,
        toggleCommonTaskCompletion,
        archiveCurrentTask,
        submitUploadRequest,
        likePost,
        deleteCommunityPost,
        updateCommunityPost,
        approveUploadRequest,
        rejectUploadRequest,
        createCommunityPost,
        updateCommonTask,
        makeStudentAdmin,
        demoteAdminToStudent,
        createSkillGroup,
        updateSkillGroup,
        deleteSkillGroup,
        deleteStudent,
        resetToDefaults,
      }}
    >
      {children}
    </CommunityContext.Provider>
  );
};

export { useCommunity } from '../hooks/useCommunity';
