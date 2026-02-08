"use client";

import React from 'react';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  User,
  Settings,
  Award,
  BookOpen,
  LogOut,
  HelpCircle,
} from 'lucide-react';

interface ProfileDropdownProps {
  userName?: string;
  userEmail?: string;
  userInitial?: string;
}

export function ProfileDropdown({
  userName = 'Student',
  userEmail = 'john@gmail.com',
  userInitial = 'J',
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full    flex items-center justify-center text-white font-bold hover:shadow-lg transition-shadow"
      >
        {userInitial}
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="font-semibold text-black">{userName}</div>
            <div className="text-sm text-gray-500">{userEmail}</div>
          </div>
          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/lms/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-black hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4" />
              My Profile
            </Link>
            <Link
              href="/lms/courses"
              className="flex items-center gap-3 px-4 py-2 text-sm text-black hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <BookOpen className="h-4 w-4" />
              My Courses
            </Link>
            <Link
              href="/lms/certificates"
              className="flex items-center gap-3 px-4 py-2 text-sm text-black hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <Award className="h-4 w-4" />
              Certificates
            </Link>
            <Link
              href="/lms/profile"
              className="flex items-center gap-3 px-4 py-2 text-sm text-black hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
          <div className="border-t border-gray-100 py-2">
            <Link
              href="/faq"
              className="flex items-center gap-3 px-4 py-2 text-sm text-black hover:bg-gray-50"
              onClick={() => setIsOpen(false)}
            >
              <HelpCircle className="h-4 w-4" />
              Help & Support
            </Link>
            <button
              className="flex items-center gap-3 px-4 py-2 text-sm text-brand-blue-600 hover:bg-red-50 w-full"
              onClick={() => {
                setIsOpen(false);
                // Add logout logic here
              }}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
