import React, { useState } from 'react';
import {
  Users,
  Shield,
  UserCheck,
  LogOut,
  Menu,
  X,
  Compass,
  LayoutDashboard,
  CheckSquare,
  Layers,
  MessageSquare,
  FileSpreadsheet,
  Trophy,
  User,
  ChevronDown,
  RotateCcw,
} from 'lucide-react';
import { useCommunity } from '../../hooks/useCommunity';
import { BRAND_CONFIG } from '../../config/branding';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  onOpenAuth: (mode: 'signin' | 'signup') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAuth,
}) => {
  const { currentUser, isAdmin, isHostAdmin, logout, resetToDefaults } = useCommunity();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switcherOpen, setSwitcherOpen] = useState(false);

  // Proper Logical Sequence:
  // 1. Home -> 2. Dashboard -> 3. Common Task -> 4. Skill Groups -> 5. Community -> 6. MS Excel -> 7. Leaderboard -> 8. My Profile -> (9. Admin Panel)
  const navItems = [
    { id: 'home', label: 'Home', icon: Compass },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'task', label: 'Common Task', icon: CheckSquare },
    { id: 'groups', label: 'Skill Groups', icon: Layers },
    { id: 'community', label: 'Community', icon: MessageSquare },
    { id: 'excel', label: 'MS Excel', icon: FileSpreadsheet },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy, badge: 'Future' },
    { id: 'profile', label: 'My Profile', icon: User },
  ];

  // Admin Panel only visible to Admin
  if (isAdmin) {
    navItems.push({ id: 'admin', label: 'Admin Panel', icon: Shield, badge: 'Admin' });
  }

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#FFFFFF]/95 backdrop-blur-md border-b border-[#E5E7EB]">
      <div className="w-full max-w-[1440px] mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 gap-1.5 sm:gap-3">
          {/* Logo / Brand Name */}
          <button
            onClick={() => handleNavClick('home')}
            type="button"
            className="flex items-center gap-2 text-left focus:outline-none group cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#080808] border border-[#080808] flex items-center justify-center text-white transition-transform group-hover:scale-105 shadow-xs shrink-0">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden sm:block shrink-0">
              <div className="text-xs sm:text-sm font-extrabold tracking-tight text-[#080808] flex items-center gap-1.5 whitespace-nowrap">
                {BRAND_CONFIG.websiteName.toUpperCase()}
                <span className="w-1.5 h-1.5 rounded-full bg-[#080808] animate-pulse" />
              </div>
              <div className="hidden 2xl:block text-[10px] uppercase font-mono text-[#666666] tracking-wider whitespace-nowrap">
                {BRAND_CONFIG.tagline}
              </div>
            </div>
          </button>

          {/* Desktop Navigation - Responsive & Auto-Fitting Without Squeezing User Area */}
          <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 bg-[#F3F4F6] border border-[#E5E7EB] rounded-full p-1 overflow-x-auto no-scrollbar min-w-0 max-w-fit mx-1 xl:mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  type="button"
                  className={`shrink-0 whitespace-nowrap px-2 xl:px-2.5 py-1.5 rounded-full text-[11px] xl:text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#080808] text-white shadow-xs'
                      : 'text-[#4B5563] hover:text-[#080808] hover:bg-[#E5E7EB]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="whitespace-nowrap">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`shrink-0 whitespace-nowrap text-[8px] font-mono px-1 py-0.2 rounded-full border hidden xl:inline-block ${
                        isActive
                          ? 'bg-white text-[#080808] border-white font-bold'
                          : item.id === 'admin'
                          ? 'bg-[#080808] text-white border-[#080808]'
                          : 'bg-[#E5E7EB] text-[#4B5563] border-[#D1D5DB]'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Account / Role Switcher / Auth - Guaranteed Safe Right-Side Visibility */}
          <div className="hidden md:flex items-center gap-1.5 sm:gap-2 shrink-0 z-10 ml-auto sm:ml-0">
            {currentUser ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                {/* Active Profile Dropdown Container */}
                <div className="relative">
                  <button
                    onClick={() => setSwitcherOpen(!switcherOpen)}
                    type="button"
                    className="px-2 sm:px-3 py-1.5 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] hover:border-[#080808] text-xs font-semibold text-[#080808] flex items-center gap-1.5 sm:gap-2 transition-all cursor-pointer shadow-xs whitespace-nowrap"
                    title="Active Account Profile"
                  >
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isAdmin ? 'bg-[#080808]' : 'bg-[#10B981]'
                      }`}
                    />
                    <span className="font-bold whitespace-nowrap max-w-[65px] sm:max-w-[85px] xl:max-w-[110px] truncate">
                      {currentUser.name.split(' ')[0]}
                    </span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-mono font-bold whitespace-nowrap ${
                      isAdmin ? 'bg-[#080808] text-white' : 'bg-[#F3F4F6] text-[#555555] border border-[#E5E7EB]'
                    }`}>
                      {isAdmin ? 'Admin' : 'Student'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-[#666666] transition-transform duration-150 ${switcherOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {switcherOpen && (
                    <>
                      {/* Click Outside Backdrop */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setSwitcherOpen(false)}
                      />

                      {/* Profile Card Modal Dropdown */}
                      <div className="absolute right-0 top-full mt-2 w-80 sm:w-84 max-w-[calc(100vw-1.5rem)] rounded-2xl bg-[#FFFFFF] border border-[#E5E7EB] shadow-2xl p-4 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                        {/* Header */}
                        <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-[#E5E7EB]">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#666666] font-bold flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 text-[#080808]" />
                            <span>Active Profile</span>
                          </span>
                          <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full uppercase font-bold ${
                            isAdmin ? 'bg-[#080808] text-white' : 'bg-[#F3F4F6] text-[#555555] border border-[#E5E7EB]'
                          }`}>
                            {isAdmin ? 'Host Admin' : 'Student'}
                          </span>
                        </div>

                        {/* Profile Info Card (Full Name & Uncut Email) */}
                        <div className="flex items-start gap-3 p-3 bg-[#F9FAFB] rounded-xl border border-[#E5E7EB] mb-3">
                          <div className="w-10 h-10 rounded-xl bg-[#080808] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs overflow-hidden">
                            {currentUser.avatar ? (
                              <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
                            ) : (
                              currentUser.name.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-sm text-[#080808] leading-tight break-words">
                              {currentUser.name}
                            </div>
                            <div className="text-[11px] text-[#555555] font-mono break-all mt-1 select-all leading-snug">
                              {currentUser.email}
                            </div>
                          </div>
                        </div>

                        {/* Quick Navigation Links */}
                        <div className="space-y-1.5 mb-3">
                          <button
                            onClick={() => {
                              handleNavClick('profile');
                              setSwitcherOpen(false);
                            }}
                            type="button"
                            className="w-full py-2 px-3 rounded-xl bg-[#080808] hover:bg-[#222222] text-white text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer shadow-xs"
                          >
                            <span className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-white" />
                              <span>View & Edit My Profile</span>
                            </span>
                            <span className="text-[10px] font-mono text-[#AAAAAA]">→</span>
                          </button>

                          {isAdmin && (
                            <button
                              onClick={() => {
                                handleNavClick('admin');
                                setSwitcherOpen(false);
                              }}
                              type="button"
                              className="w-full py-2 px-3 rounded-xl bg-[#FFFFFF] hover:bg-[#F3F4F6] text-[#080808] text-xs font-semibold flex items-center justify-between border border-[#D1D5DB] transition-colors cursor-pointer"
                            >
                              <span className="flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5 text-[#080808]" />
                                <span>Admin Control Panel</span>
                              </span>
                              <span className="text-[10px] font-mono text-[#888888]">→</span>
                            </button>
                          )}
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-2.5 border-t border-[#E5E7EB] flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              logout();
                              setSwitcherOpen(false);
                            }}
                            type="button"
                            className="px-2 py-1.5 rounded-lg text-xs font-semibold text-[#DC2626] hover:bg-[#FEF2F2] flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            <span>Sign Out</span>
                          </button>

                          {isHostAdmin && (
                            <button
                              onClick={() => {
                                if (window.confirm('Reset all website data to clean state?')) {
                                  resetToDefaults();
                                  setSwitcherOpen(false);
                                }
                              }}
                              type="button"
                              className="text-[10px] font-mono text-[#888888] hover:text-[#080808] hover:underline flex items-center gap-1 cursor-pointer"
                              title="Reset demo data"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Reset All Data</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  type="button"
                  title="Logout"
                  className="p-2 rounded-xl bg-[#FFFFFF] border border-[#D1D5DB] text-[#666666] hover:text-[#080808] hover:border-[#080808] transition-colors cursor-pointer shadow-xs shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => onOpenAuth('signin')}
                  type="button"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#080808] hover:bg-[#F3F4F6] border border-[#D1D5DB] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuth('signup')}
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#080808] text-white hover:bg-[#222222] transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs whitespace-nowrap"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-lg bg-[#F3F4F6] border border-[#E5E7EB] text-[#080808] hover:bg-[#E5E7EB] transition-colors cursor-pointer"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#E5E7EB] bg-[#FFFFFF] px-4 pt-3 pb-6 animate-in slide-in-from-top duration-150 shadow-lg">
          <div className="space-y-1 mb-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  type="button"
                  className={`w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-medium flex items-center justify-between transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#080808] text-white font-bold'
                      : 'text-[#080808] hover:bg-[#F3F4F6]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{item.label}</span>
                    {item.badge && (
                      <span className="text-[8px] font-mono px-1.5 py-0.2 rounded-full bg-[#E5E7EB] text-[#555555]">
                        {item.badge}
                      </span>
                    )}
                  </span>
                  {item.id === 'admin' && (
                    <span className="text-[9px] px-2 py-0.5 rounded bg-black text-white font-mono">
                      Admin Only
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-[#E5E7EB]">
            {currentUser ? (
              <div className="flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#080808]">{currentUser.name}</div>
                  <div className="text-[11px] text-[#666666] font-mono">{currentUser.email}</div>
                </div>
                <button
                  onClick={logout}
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-[#F3F4F6] border border-[#D1D5DB] text-xs font-semibold text-[#080808] hover:bg-[#E5E7EB] cursor-pointer"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signin');
                  }}
                  type="button"
                  className="py-2 text-center text-xs font-semibold text-[#080808] bg-[#F3F4F6] border border-[#D1D5DB] rounded-lg cursor-pointer"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signup');
                  }}
                  type="button"
                  className="py-2 text-center text-xs font-bold text-white bg-[#080808] rounded-lg cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
