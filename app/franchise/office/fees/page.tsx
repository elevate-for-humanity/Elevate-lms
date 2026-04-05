'use client';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  DollarSign,
  Plus,
  Loader2,
  Save,
  Trash2,
  Star
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/use-toast';

interface FeeSchedule {
  id: string;
  name: string;
  is_default: boolean;
  base_fee_1040: number;
  base_fee_1040_ez: number;
  fee_schedule_a: number;
  fee_schedule_c: number;
  fee_schedule_d: number;
  fee_schedule_e: number;
  fee_schedule_se: number;
  fee_per_w2: number;
  fee_per_1099: number;
  fee_per_dependent: number;
  fee_state_return: number;
  fee_eitc: number;
  fee_ctc: number;
  fee_refund_transfer: number;
  fee_refund_advance: number;
  returning_client_discount_percent: number;
  referral_discount: number;
  senior_discount_percent: number;
  military_discount_percent: number;
}

const defaultSchedule: Omit<FeeSchedule, 'id'> = {
  name: 'Standard Fees',
  is_default: true,
  base_fee_1040: 150,
  base_fee_1040_ez: 75,
  fee_schedule_a: 50,
  fee_schedule_c: 100,
  fee_schedule_d: 50,
  fee_schedule_e: 75,
  fee_schedule_se: 25,
  fee_per_w2: 0,
  fee_per_1099: 15,
  fee_per_dependent: 25,
  fee_state_return: 50,
  fee_eitc: 50,
  fee_ctc: 25,
  fee_refund_transfer: 35,
  fee_refund_advance: 0,
  returning_client_discount_percent: 10,
  referral_discount: 25,
  senior_discount_percent: 10,
  military_discount_percent: 15
};

export default function FeeSchedulesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [office, setOffice] = useState<any>(null);
  const [schedules, setSchedules] = useState<FeeSchedule[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<FeeSchedule | null>(null);
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        window.location.href = '/login';
        return;
      }

      const { data: officeData } = await supabase
        .from('franchise_offices')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (!officeData) {
        setLoading(false);
        return;
      }

      setOffice(officeData);

      const { data: schedulesData } = await supabase
        .from('franchise_fee_schedules')
        .select('*')
        .eq('office_id', officeData.id)
        .order('is_default', { ascending: false })
        .order('name');

      if (schedulesData) {
        setSchedules(schedulesData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  function startNewSchedule() {
    setEditingSchedule({ ...defaultSchedule, id: '' } as FeeSchedule);
    setIsNew(true);
  }

  function editSchedule(schedule: FeeSchedule) {
    setEditingSchedule({ ...schedule });
    setIsNew(false);
  }

  function cancelEdit() {
    setEditingSchedule(null);
    setIsNew(false);
  }

  async function saveSchedule() {
    if (!editingSchedule || !office) return;

    setSaving(true);
    try {
      const supabase = createClient();

      if (isNew) {
        // If setting as default, unset others
        if (editingSchedule.is_default) {
          await supabase
            .from('franchise_fee_schedules')
            .update({ is_default: false })
            .eq('office_id', office.id);
        }

        const { error } = await supabase
          .from('franchise_fee_schedules')
          .insert({
            ...editingSchedule,
            id: undefined,
            office_id: office.id
          });

        if (error) throw error;

        toast({ title: 'Fee Schedule Created' });
      } else {
        // If setting as default, unset others
        if (editingSchedule.is_default) {
          await supabase
            .from('franchise_fee_schedules')
            .update({ is_default: false })
            .eq('office_id', office.id)
            .neq('id', editingSchedule.id);
        }

        const { error } = await supabase
          .from('franchise_fee_schedules')
          .update(editingSchedule)
          .eq('id', editingSchedule.id);

        if (error) throw error;

        toast({ title: 'Fee Schedule Updated' });
      }

      setEditingSchedule(null);
      setIsNew(false);
      loadData();
    } catch (error) {
      console.error('Error saving schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to save fee schedule',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  }

  async function deleteSchedule(scheduleId: string) {
    if (!confirm('Are you sure you want to delete this fee schedule?')) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('franchise_fee_schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      toast({ title: 'Fee Schedule Deleted' });
      loadData();
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete fee schedule',
        variant: 'destructive'
      });
    }
  }

  function updateField(field: keyof FeeSchedule, value: number | string | boolean) {
    if (!editingSchedule) return;
    setEditingSchedule({ ...editingSchedule, [field]: value });
  }

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
            <Breadcrumbs items={[{ label: "Franchise", href: "/franchise" }, { label: "Office", href: "/franchise/office" }, { label: "Fees" }]} />
{/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/franchise/office/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Fee Schedules</h1>
            <p className="text-muted-foreground">
              Manage your office's fee structures
            </p>
          </div>
        </div>
        {!editingSchedule && (
          <Button onClick={startNewSchedule}>
            <Plus className="mr-2 h-4 w-4" />
            New Schedule
          </Button>
        )}
      </div>

      {/* Editor */}
      {editingSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>
              {isNew ? 'New Fee Schedule' : 'Edit Fee Schedule'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Schedule Name</Label>
                <Input 
                  value={editingSchedule.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 pt-8">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={editingSchedule.is_default}
                  onChange={(e) => updateField('is_default', e.target.checked)}
                />
                <Label htmlFor="isDefault">Set as default</Label>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Base Fees</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Form 1040</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.base_fee_1040}
                    onChange={(e) => updateField('base_fee_1040', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Form 1040-EZ</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.base_fee_1040_ez}
                    onChange={(e) => updateField('base_fee_1040_ez', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Schedule Fees</h3>
              <div className="grid grid-cols-5 gap-4">
                {['A', 'C', 'D', 'E', 'SE'].map((sched) => (
                  <div key={sched} className="space-y-2">
                    <Label>Schedule {sched}</Label>
                    <Input 
                      type="number"
                      value={(editingSchedule as any)[`fee_schedule_${sched.toLowerCase()}`]}
                      onChange={(e) => updateField(`fee_schedule_${sched.toLowerCase()}` as keyof FeeSchedule, parseFloat(e.target.value) || 0)}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Per-Item Fees</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Per W-2</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.fee_per_w2}
                    onChange={(e) => updateField('fee_per_w2', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per 1099</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.fee_per_1099}
                    onChange={(e) => updateField('fee_per_1099', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Per Dependent</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.fee_per_dependent}
                    onChange={(e) => updateField('fee_per_dependent', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>State Return</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.fee_state_return}
                    onChange={(e) => updateField('fee_state_return', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Credit & Bank Product Fees</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>EITC</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.fee_eitc}
                    onChange={(e) => updateField('fee_eitc', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Child Tax Credit</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.fee_ctc}
                    onChange={(e) => updateField('fee_ctc', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Refund Transfer</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.fee_refund_transfer}
                    onChange={(e) => updateField('fee_refund_transfer', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Refund Advance</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.fee_refund_advance}
                    onChange={(e) => updateField('fee_refund_advance', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Discounts</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Returning Client (%)</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.returning_client_discount_percent}
                    onChange={(e) => updateField('returning_client_discount_percent', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Referral ($)</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.referral_discount}
                    onChange={(e) => updateField('referral_discount', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Senior (%)</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.senior_discount_percent}
                    onChange={(e) => updateField('senior_discount_percent', parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Military (%)</Label>
                  <Input 
                    type="number"
                    value={editingSchedule.military_discount_percent}
                    onChange={(e) => updateField('military_discount_percent', parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button variant="outline" onClick={cancelEdit}>Cancel</Button>
              <Button onClick={saveSchedule} disabled={saving}>
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Schedule
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule List */}
      {!editingSchedule && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Schedules</CardTitle>
            <CardDescription>
              {schedules.length} schedule{schedules.length !== 1 ? 's' : ''} configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schedules.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg font-medium">No fee schedules</p>
                <p className="text-muted-foreground mb-4">
                  Create your first fee schedule to start
                </p>
                <Button onClick={startNewSchedule}>Create Schedule</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {schedules.map((schedule) => (
                  <div 
                    key={schedule.id} 
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{schedule.name}</p>
                        {schedule.is_default && (
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Base: ${schedule.base_fee_1040} (1040) / ${schedule.base_fee_1040_ez} (1040-EZ)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => editSchedule(schedule)}>
                        Edit
                      </Button>
                      {!schedule.is_default && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => deleteSchedule(schedule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
