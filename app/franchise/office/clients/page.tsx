'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Search,
  Plus,
  ArrowLeft,
  Phone,
  Mail,
  FileText
} from 'lucide-react';
import Link from 'next/link';

interface Client {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  ssn_last_four: string;
  filing_status: string | null;
  returns_filed: number;
  total_fees_paid: number;
  status: string;
  last_return_date: string | null;
}

export default function ClientsPage() {
  const [loading, setLoading] = useState(true);
  const [office, setOffice] = useState<any>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);

  const loadClients = useCallback(async (officeId: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('franchise_clients')
      .select('*')
      .eq('office_id', officeId)
      .order('last_name');

    if (data) {
      setClients(data);
      setFilteredClients(data);
    }
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      setFilteredClients(clients.filter(c => 
        c.first_name.toLowerCase().includes(query) ||
        c.last_name.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.ssn_last_four.includes(query)
      ));
    } else {
      setFilteredClients(clients);
    }
  }, [searchQuery, clients]);

  const loadData = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login';
        return;
      }

      // Get user's office
      const { data: officeData } = await supabase
        .from('franchise_offices')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (!officeData) {
        // Check if preparer
        const { data: preparer } = await supabase
          .from('franchise_preparers')
          .select('*, office:franchise_offices(*)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (preparer?.office) {
          setOffice(preparer.office);
          await loadClients(preparer.office.id);
        }
      } else {
        setOffice(officeData);
        await loadClients(officeData.id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [loadClients]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!office) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      <Breadcrumbs items={[{ label: 'Franchise', href: '/franchise' }, { label: 'Office', href: '/franchise/office' }, { label: 'Clients' }]} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/franchise/office">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Clients</h1>
            <p className="text-muted-foreground">
              Manage your office's tax clients
            </p>
          </div>
        </div>
        <Link href="/franchise/office/clients/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Client
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or last 4 of SSN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle>All Clients</CardTitle>
          <CardDescription>
            {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No clients found</p>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'Try a different search term' : 'Add your first client to get started'}
              </p>
              {!searchQuery && (
                <Link href="/franchise/office/clients/new">
                  <Button>Add Client</Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div 
                  key={client.id} 
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      <Users className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {client.first_name} {client.last_name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        SSN: ***-**-{client.ssn_last_four}
                      </p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {client.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {client.email}
                          </span>
                        )}
                        {client.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Returns</p>
                      <p className="font-medium flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {client.returns_filed}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">Total Fees</p>
                      <p className="font-medium">${client.total_fees_paid?.toLocaleString() || 0}</p>
                    </div>
                    <Badge variant={
                      client.status === 'active' ? 'default' :
                      client.status === 'do_not_serve' ? 'destructive' :
                      'secondary'
                    }>
                      {client.status}
                    </Badge>
                    <Link href={`/franchise/office/clients/${client.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
