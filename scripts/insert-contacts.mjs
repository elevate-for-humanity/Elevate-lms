#!/usr/bin/env node

const SUPABASE_URL = "https://cuxzzpsyufcewtmicszk.supabase.co";
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SERVICE_ROLE_KEY) { console.error("SUPABASE_SERVICE_ROLE_KEY is required"); process.exit(1); }

const contacts = [
  {
    email: "Info@totalsupporthomecare.org",
    full_name: "Jakelia Taylor",
    message: "Hello my name is Jakelia Taylor I meet you picking up the chairs from the storage. We spoke about you sending me information on how we could connect I look forward in hearing from you soon! Best Regards",
    interest: "General Interest",
    status: "new"
  },
  {
    email: "mella.holifield@icloud.com",
    full_name: "Premella Holifield",
    message: "Educator",
    interest: "Educator",
    status: "new"
  },
  {
    email: "a_hurns@yahoo.com",
    full_name: "Angela Hurns",
    message: "I spoke with Ms. Elizabeth today and wanted to receive more information about the programs offered.",
    interest: "General Programs",
    status: "new"
  },
  {
    email: "harriskimberly738@gmail.com",
    full_name: "Kimberly Harris",
    message: "I'm interested CDL training",
    interest: "CDL Training",
    status: "new"
  },
  {
    email: "dkalandry@gmail.com",
    full_name: "Koman djan",
    message: "Good morning , I am interested in taking one of your training program so please i would like to get more information how to get in . Thank you",
    interest: "General Training",
    status: "new"
  },
  {
    email: "eviennejoseph1083@yahoo.com",
    full_name: "Eve",
    message: "Hey you did my hair on Nov 1 . We did discuss about hvac school, how we can come up with a plan to work together .",
    interest: "HVAC Training",
    status: "new"
  },
  {
    email: "rerobison5@gmail.com",
    full_name: "robert robison",
    message: "I am interested in starting a business and need help with funding",
    interest: "Business Start-Up",
    status: "new"
  },
  {
    email: "1sarralee@gmail.com",
    full_name: "Sarra L Foster",
    message: "I would like to start learning about Tax preparation.",
    interest: "Tax Preparation",
    status: "new"
  },
  {
    email: "keiransolace@gmail.com",
    full_name: "Jordan McClung",
    message: "So i talked to one of your workers and I was asking them if there was a digital design programm and they said they would make it just for me and I was happy they said they would have it done by last Friday but it's be 6 days now and I keep calling them about it but they really don't help so can you please reach out to me i already have a account on elevate for humanity program website and a account on indeed job search.",
    interest: "Digital Design",
    status: "new"
  },
  {
    email: "Blaisefilsinger@icloud.com",
    full_name: "Blaise Filsinger",
    message: "I spoke to the woman at Wednesdays career fair in Indianapolis. I drove a tractor trailer, CDL A driving for 13 years, she told me about being a driver trainer starting my own school. I'm interested in hearing more about that opportunity.",
    interest: "CDL Instructor",
    status: "new"
  },
  {
    email: "maryannelundy@gmail.com",
    full_name: "Maryanne Lundy",
    message: "TAX CLASS",
    interest: "Tax Preparation",
    status: "new"
  },
  {
    email: "Reshow@yahoo.com",
    full_name: "Reshown Mcnary",
    message: "I would like to know what type of programs y'all offer and what type of funding do y'all have?",
    interest: "General Programs",
    status: "new"
  },
  {
    email: "winfordsonya@yahoo.com",
    full_name: "Sonya Winford",
    message: "I'm interested in the HHA training program",
    interest: "HHA Training",
    status: "new"
  },
  {
    email: "mcclujor000@warren.k12.in.us",
    full_name: "Jordan McClung",
    message: "I was wondering if yall have like a animation program or something similar to that.",
    interest: "Animation Program",
    status: "new"
  },
  {
    email: "Baileeli000@gmail.com",
    full_name: "Elijah Bailey",
    message: "I was told to contact yall for a dental program funding",
    interest: "Dental Program",
    status: "new"
  },
  {
    email: "Litherland.salena@gmail.com",
    full_name: "Salena Lithetland",
    message: "I want to start my journey in cosmetology asap I want to be know for my work an maybe work with celebrities some day",
    interest: "Cosmetology",
    status: "new"
  },
  {
    email: "miyahras@gmail.com",
    full_name: "Miyahra Sanders",
    message: "Hi , I havee a 16yr old and 17yr old interested in the cosmetology and nail program. Cold you please let me know what youth grants/programs you may offer and hot to get them enrolled as soon as possible ? please send me an email as i am a nursing student trying to help my daughters out",
    interest: "Youth Cosmetology",
    status: "new"
  }
];

async function insertContacts() {

  for (const contact of contacts) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/marketing_contacts`, {
        method: "POST",
        headers: {
          "apikey": SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "return=representation"
        },
        body: JSON.stringify(contact)
      });

      if (response.ok) {
      } else {
        const error = await response.text();
        if (error.includes("duplicate") || error.includes("23505")) {
        } else {
        }
      }
    } catch (err) {
      console.error(`❌ Error inserting ${contact.email}:`, err.message);
    }
  }


  // Verify count
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/marketing_contacts?select=count`, {
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Prefer": "count=exact"
      }
    });

    const data = await response.json();
  } catch (err) {
    console.error("Error getting count:", err.message);
  }
}

insertContacts().catch(console.error);
