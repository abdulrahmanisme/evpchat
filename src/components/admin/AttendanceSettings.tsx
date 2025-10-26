import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Shield, User, Settings } from 'lucide-react';

export const AttendanceSettings = () => {
  const [allowUpdates, setAllowUpdates] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_settings')
        .select('*')
        .eq('setting_key', 'allow_campus_leads_update')
        .single();

      if (error) {
        // If table doesn't exist yet, default to allowing updates
        if (error.code === 'PGRST205' || error.code === '42P01') {
          console.log('Settings table not found, using default (allow updates)');
          setAllowUpdates(true);
        } else {
          throw error;
        }
      } else {
        setAllowUpdates(data?.setting_value ?? true);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Don't show error toast for missing table - just use default
      setAllowUpdates(true);
    } finally {
      setLoading(false);
    }
  };

  const toggleSettings = async (enabled: boolean) => {
    try {
      setSaving(true);
      
      // Try to update first
      let { error: updateError } = await supabase
        .from('attendance_settings')
        .update({ 
          setting_value: enabled,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'allow_campus_leads_update');

      // If update fails, try to insert
      if (updateError && (updateError.code === 'PGRST205' || updateError.code === '42P01')) {
        const { error: insertError } = await supabase
          .from('attendance_settings')
          .insert({ 
            setting_key: 'allow_campus_leads_update',
            setting_value: enabled,
            description: 'Allow campus leads to update their own office attendance'
          });
        
        if (insertError) throw insertError;
      } else if (updateError) {
        throw updateError;
      }

      setAllowUpdates(enabled);
      toast.success(enabled ? 'Campus leads can now update attendance' : 'Campus leads cannot update attendance');
    } catch (error: any) {
      console.error('Error updating settings:', error);
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Settings className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>Office Attendance Settings</CardTitle>
              <CardDescription>
                Control whether campus leads can update their office attendance records
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Main Toggle */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <Label htmlFor="allow-updates" className="text-base font-semibold">
                    Allow Campus Leads to Update Attendance
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    When enabled, campus leads can mark their office attendance on the calendar.
                    When disabled, only admins can manage attendance.
                  </p>
                </div>
              </div>
              <Switch
                id="allow-updates"
                checked={allowUpdates}
                onCheckedChange={toggleSettings}
                disabled={saving}
              />
            </div>

            {/* Current Status */}
            <div className={`p-4 rounded-lg border ${
              allowUpdates 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {allowUpdates ? (
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-2" />
                )}
                <div>
                  <p className={`font-semibold ${
                    allowUpdates ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {allowUpdates ? 'Updates Enabled' : 'Updates Disabled'}
                  </p>
                  <p className={`text-sm ${
                    allowUpdates ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {allowUpdates 
                      ? 'Campus leads can currently mark and update their office attendance on the calendar.'
                      : 'Campus leads cannot update their office attendance. Only admins can manage attendance records.'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Note for Admins:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    <li>Campus leads can only update attendance for past dates and today</li>
                    <li>When disabled, admins retain full control over all attendance records</li>
                    <li>This setting applies to all campus leads immediately</li>
                    <li>Use this toggle during attendance review periods or when you need to lock records</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

