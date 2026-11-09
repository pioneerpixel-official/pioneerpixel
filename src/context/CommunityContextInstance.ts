import { createContext } from 'react';
import type {
  StudentProfile,
  SkillGroup,
  CommonTask,
  ArchivedTask,
  UploadRequest,
  CommunityPost,
  StudentSkill,
  MonthlyProgress,
} from '../types/community';

export interface CommunityContextType {
  currentUser: StudentProfile | null;
  students: StudentProfile[];
  groups: SkillGroup[];
  commonTask: CommonTask;
  previousTasks: ArchivedTask[];
  uploadRequests: UploadRequest[];
  communityPosts: CommunityPost[];
  isAdmin: boolean;
  isHostAdmin: boolean;

  // Auth & User switching
  login: (email: string, password?: string) => { success: boolean; error?: string };
  signup: (
    name: string,
    email: string,
    password?: string
  ) => { success: boolean; error?: string };
  resetPassword: (email: string, newPassword: string) => { success: boolean; error?: string };
  logout: () => void;
  switchUser: (userId: string) => void;

  // Profile management
  updateProfile: (updated: Partial<StudentProfile>) => void;
  addSkill: (skill: Omit<StudentSkill, 'id'>) => void;
  updateSkill: (skillId: string, updated: Partial<StudentSkill>) => void;
  removeSkill: (skillId: string) => void;
  updateMonthlyProgress: (progress: Partial<MonthlyProgress>) => void;

  // AI & Quizzes
  recordQuizCompletion: (studentId: string, earnedPoints: number) => void;

  // Skill Groups (Max 2 rule enforced)
  joinGroup: (groupId: string) => { success: boolean; error?: string };
  leaveGroup: (groupId: string) => void;
  addGroupResource: (
    groupId: string,
    resource: { type: 'note' | 'image' | 'video'; title: string; content: string; mediaUrl?: string }
  ) => { success: boolean; error?: string };

  // Common Task
  submitCommonTask: (text: string, link?: string) => void;
  toggleCommonTaskCompletion: () => void;
  archiveCurrentTask: () => void;

  // Student Upload Request
  submitUploadRequest: (
    type: 'photo' | 'note' | 'text',
    title: string,
    content: string,
    mediaUrl?: string
  ) => { success: boolean; message: string };

  // Community Feed
  likePost: (postId: string) => void;
  deleteCommunityPost: (postId: string) => void;
  updateCommunityPost: (postId: string, updated: Partial<CommunityPost>) => void;

  // Admin Operations
  approveUploadRequest: (requestId: string) => void;
  rejectUploadRequest: (requestId: string, feedback?: string) => void;
  createCommunityPost: (post: {
    type: 'image' | 'note' | 'text';
    title?: string;
    content: string;
    mediaUrl?: string;
    tag?: string;
  }) => void;
  updateCommonTask: (task: Partial<CommonTask>) => void;
  makeStudentAdmin: (studentId: string) => void;
  demoteAdminToStudent: (studentId: string) => void;
  createSkillGroup: (name: string, description: string, category: string, adminName: string) => void;
  updateSkillGroup: (groupId: string, updated: Partial<SkillGroup>) => void;
  deleteSkillGroup: (groupId: string) => void;
  deleteStudent: (studentId: string) => void;
  resetToDefaults: () => void;
}

export const CommunityContext = createContext<CommunityContextType | undefined>(undefined);
