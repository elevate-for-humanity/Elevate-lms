"use client";

import React from 'react';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

/**
 * ClaimApplications Component
 *
 * Automatically claims any applications submitted before login
 * by matching the user's email address.
 *
 * Runs on:
 * - Component mount (for page visits)
 * - SIGNED_IN auth event (for fresh logins)
 *
 * Usage: Add to layout or authenticated pages
 */
export function ClaimApplications() {
  useEffect(() => {
    const supabase = createClient();

    const claimApplications = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email) return;

        // First, check for unclaimed applications matching user's email
        const { data: unclaimedApps } = await supabase
          .from('applications')
          .select('id, email, program_id, status')
          .eq('email', user.email)
          .is('user_id', null);

        if (unclaimedApps && unclaimedApps.length > 0) {
          // Claim applications by updating user_id
          const { error: updateError } = await supabase
            .from('applications')
            .update({ 
              user_id: user.id,
              claimed_at: new Date().toISOString()
            })
            .eq('email', user.email)
            .is('user_id', null);

          if (!updateError) {
            // Log the claim event
            await supabase
              .from('application_claim_log')
              .insert({
                user_id: user.id,
                email: user.email,
                applications_claimed: unclaimedApps.length,
                claimed_at: new Date().toISOString()
              });
          }
        }

        // Also try the RPC function as fallback
        const { data, error } = await supabase.rpc(
          'claim_applications_for_current_user'
        );

        if (error) {
          /* Claim error handled silently */
        } else if (data > 0) {
          /* Applications claimed successfully */
        }
      } catch (error) { /* Error handled silently */ }
    };

    // Claim on mount
    claimApplications();

    // Also claim on auth state change (SIGNED_IN event)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        await claimApplications();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // This component doesn't render anything
  return null;
}
