import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cuxzzpsyufcewtmicszk.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function inspect() {
  const { data, error } = await supabase
    .from('barber_subscriptions')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('Columns in barber_subscriptions:');
    console.log(Object.keys(data[0]).sort());
    console.log('\nSample record:');
    console.log(data[0]);
  }
}

inspect();
