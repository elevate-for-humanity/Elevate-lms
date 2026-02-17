export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { withAuth } from '@/lib/with-auth';
import { logger } from '@/lib/logger';
import { toError, toErrorMessage } from '@/lib/safe';

export const POST = withAuth(
  async (req: NextRequest, user) => {
    try {
      const supabase = await createClient();

      // Step 1: Create the table
      // logger.info("Creating marketing_contacts table...");

      const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.marketing_contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        phone TEXT,
        message TEXT,
        source TEXT DEFAULT 'website',
        tags TEXT[] DEFAULT '{}',
        interest TEXT,
        status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'enrolled', 'not_interested')),
        unsubscribed BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now(),
        last_contacted_at TIMESTAMPTZ,
        notes TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_marketing_contacts_email ON public.marketing_contacts(email);
      CREATE INDEX IF NOT EXISTS idx_marketing_contacts_status ON public.marketing_contacts(status);
      CREATE INDEX IF NOT EXISTS idx_marketing_contacts_created_at ON public.marketing_contacts(created_at DESC);

      ALTER TABLE public.marketing_contacts ENABLE ROW LEVEL SECURITY;

      DROP POLICY IF EXISTS "Service role has full access to marketing_contacts" ON public.marketing_contacts;
      CREATE POLICY "Service role has full access to marketing_contacts"
        ON public.marketing_contacts
        FOR ALL
        TO service_role
        USING (true)
        WITH CHECK (true);

      DROP POLICY IF EXISTS "Authenticated users can read marketing_contacts" ON public.marketing_contacts;
      CREATE POLICY "Authenticated users can read marketing_contacts"
        ON public.marketing_contacts
        FOR SELECT
        TO authenticated
        USING (true);

      DROP POLICY IF EXISTS "Authenticated users can insert marketing_contacts" ON public.marketing_contacts;
      CREATE POLICY "Authenticated users can insert marketing_contacts"
        ON public.marketing_contacts
        FOR INSERT
        TO authenticated
        WITH CHECK (true);

      DROP POLICY IF EXISTS "Authenticated users can update marketing_contacts" ON public.marketing_contacts;
      CREATE POLICY "Authenticated users can update marketing_contacts"
        ON public.marketing_contacts
        FOR UPDATE
        TO authenticated
        USING (true)
        WITH CHECK (true);
    `;

      // Execute via raw SQL (requires service role)
      const { error: tableError } = await supabase.rpc('exec_sql', {
        sql: createTableSQL,
      });

      if (tableError && !tableError.message?.includes('already exists')) {
        logger.error('Table creation error:', tableError);
        // Continue anyway - table might already exist
      }

      // Step 2: Insert contacts
      // logger.info("Inserting contacts...");

      const contacts = [
        {
          email: 'Info@totalsupporthomecare.org',
          full_name: 'Jakelia Taylor',
          message:
            'Hello my name is Jakelia Taylor I meet you picking up the chairs from the storage. We spoke about you sending me information on how we could connect I look forward in hearing from you soon! Best Regards',
          interest: 'General Interest',
          status: 'new',
        },
        {
          email: 'mella.holifield@icloud.com',
          full_name: 'Premella Holifield',
          message: 'Educator',
          interest: 'Educator',
          status: 'new',
        },
        {
          email: 'a_hurns@yahoo.com',
          full_name: 'Angela Hurns',
          message:
            'I spoke with Ms. Elizabeth today and wanted to receive more information about the programs offered.',
          interest: 'General Programs',
          status: 'new',
        },
        {
          email: 'harriskimberly738@gmail.com',
          full_name: 'Kimberly Harris',
          message: "I'm interested CDL training",
          interest: 'CDL Training',
          status: 'new',
        },
        {
          email: 'dkalandry@gmail.com',
          full_name: 'Koman djan',
          message:
            'Good morning , I am interested in taking one of your training program so please i would like to get more information how to get in . Thank you',
          interest: 'General Training',
          status: 'new',
        },
        {
          email: 'eviennejoseph1083@yahoo.com',
          full_name: 'Eve',
          message:
            'Hey you did my hair on Nov 1 . We did discuss about hvac school, how we can come up with a plan to work together .',
          interest: 'HVAC Training',
          status: 'new',
        },
        {
          email: 'rerobison5@gmail.com',
          full_name: 'robert robison',
          message:
            'I am interested in starting a business and need help with funding',
          interest: 'Business Start-Up',
          status: 'new',
        },
        {
          email: '1sarralee@gmail.com',
          full_name: 'Sarra L Foster',
          message: 'I would like to start learning about Tax preparation.',
          interest: 'Tax Preparation',
          status: 'new',
        },
        {
          email: 'keiransolace@gmail.com',
          full_name: 'Jordan McClung',
          message:
            "So i talked to one of your workers and I was asking them if there was a digital design programm and they said they would make it just for me and I was happy they said they would have it done by last Friday but it's be 6 days now and I keep calling them about it but they really don't help so can you please reach out to me i already have a account on elevate for humanity program website and a account on indeed job search.",
          interest: 'Digital Design',
          status: 'new',
        },
        {
          email: 'Blaisefilsinger@icloud.com',
          full_name: 'Blaise Filsinger',
          message:
            "I spoke to the woman at Wednesdays career fair in Indianapolis. I drove a tractor trailer, CDL A driving for 13 years, she told me about being a driver trainer starting my own school. I'm interested in hearing more about that opportunity.",
          interest: 'CDL Instructor',
          status: 'new',
        },
        {
          email: 'maryannelundy@gmail.com',
          full_name: 'Maryanne Lundy',
          message: 'TAX CLASS',
          interest: 'Tax Preparation',
          status: 'new',
        },
        {
          email: 'Reshow@yahoo.com',
          full_name: 'Reshown Mcnary',
          message:
            "I would like to know what type of programs y'all offer and what type of funding do y'all have?",
          interest: 'General Programs',
          status: 'new',
        },
        {
          email: 'winfordsonya@yahoo.com',
          full_name: 'Sonya Winford',
          message: "I'm interested in the HHA training program",
          interest: 'HHA Training',
          status: 'new',
        },
        {
          email: 'mcclujor000@warren.k12.in.us',
          full_name: 'Jordan McClung',
          message:
            'I was wondering if yall have like a animation program or something similar to that.',
          interest: 'Animation Program',
          status: 'new',
        },
        {
          email: 'Baileeli000@gmail.com',
          full_name: 'Elijah Bailey',
          message: 'I was told to contact yall for a dental program funding',
          interest: 'Dental Program',
          status: 'new',
        },
        {
          email: 'Litherland.salena@gmail.com',
          full_name: 'Salena Lithetland',
          message:
            'I want to start my journey in cosmetology asap I want to be know for my work an maybe work with celebrities some day',
          interest: 'Cosmetology',
          status: 'new',
        },
        {
          email: 'miyahras@gmail.com',
          full_name: 'Miyahra Sanders',
          message:
            'Hi , I havee a 16yr old and 17yr old interested in the cosmetology and nail program. Cold you please let me know what youth grants/programs you may offer and hot to get them enrolled as soon as possible ? please send me an email as i am a nursing student trying to help my daughters out',
          interest: 'Youth Cosmetology',
          status: 'new',
        },
      ];

      let inserted = 0;
      let skipped = 0;

      for (const contact of contacts) {
        const { error } = await supabase
          .from('marketing_contacts')
          .insert(contact);

        if (error) {
          if (
            (error as any).code === '23505' ||
            toErrorMessage(error)?.includes('duplicate')
          ) {
            skipped++;
          } else {
            logger.error(`Error inserting ${contact.email}:`, toError(error));
          }
        } else {
          inserted++;
        }
      }

      // Get final count
      const { count } = await supabase
        .from('marketing_contacts')
        .select('*', { count: 'exact', head: true });

      return NextResponse.json({
        success: true,
        message: 'Contact management system setup complete',
        stats: {
          inserted,
          skipped,
          total: count || 0,
        },
      });
    } catch (err: any) {
      logger.error(
        'Setup error:',
        err instanceof Error ? err : new Error(String(err))
      );
      return NextResponse.json(
        {
          error: 'Setup failed',
          details: err.toString(),
        },
        { status: 500 }
      );
    }
  },
  { roles: ['admin', 'super_admin'] }
);
