// Central contact information for Elevate for Humanity
// Update these values with your actual contact details

export const CONTACT_INFO = {
  // Phone
  phone: {
    display: "(317) 314-3757", // How it appears on the site
    tel: "+13173143757",        // For tel: links (no spaces, dashes, or parentheses)
  },

  // Email - Hidden behind contact form (not displayed publicly)
  email: {
    general: "info@elevateforhumanity.org", // Used by contact form only
    support: "info@elevateforhumanity.org", // Used by contact form only
    partnerships: "info@elevateforhumanity.org", // Used by contact form only
  },

  // Address
  address: {
    street: "8888 Keystone Crossing Suite 1300",
    city: "Indianapolis",
    state: "IN",
    zip: "46240",
    full: "8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240",
  },

  // Hours
  hours: {
    office: "Monday-Friday, 9:00 AM - 5:00 PM EST",
    aiReceptionist: "24/7 - Always Available",
  },

  // Social Media
  social: {
    facebook: "https://www.facebook.com/profile.php?id=61571046346179",
    instagram: "https://instagram.com/elevateforhumanity",
    linkedin: "https://www.linkedin.com/in/elevate-for-humanity-b5a2b3339/",
  },
};

// Helper function to format phone for display
export function formatPhone(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, "($1) $2-$3");
}

// Helper function to create tel: link
export function getTelLink(phone: string): string {
  return `tel:${phone.replace(/\D/g, "")}`;
}
