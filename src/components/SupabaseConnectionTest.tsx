import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const SupabaseConnectionTest = () => {
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const [errorMessage, setErrorMessage] = useState('');
  const [tablesStatus, setTablesStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Test basic connection
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        throw error;
      }

      setConnectionStatus('connected');
      
      // Test if all required tables exist
      await testTables();
      
    } catch (error: any) {
      console.error('Connection test failed:', error);
      setConnectionStatus('error');
      setErrorMessage(error.message);
    }
  };

  const testTables = async () => {
    const tables = ['profiles', 'submissions', 'user_roles'];
    const status: Record<string, boolean> = {};

    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        status[table] = !error;
      } catch {
        status[table] = false;
      }
    }

    setTablesStatus(status);
  };

  const getStatusBadge = (status: boolean) => {
    return status ? (
      <Badge variant="default" className="bg-green-500">✓ Exists</Badge>
    ) : (
      <Badge variant="destructive">✗ Missing</Badge>
    );
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Connection Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">Connection Status:</span>
          {connectionStatus === 'testing' && <Badge variant="secondary">Testing...</Badge>}
          {connectionStatus === 'connected' && <Badge variant="default" className="bg-green-500">✓ Connected</Badge>}
          {connectionStatus === 'error' && <Badge variant="destructive">✗ Error</Badge>}
        </div>

        {connectionStatus === 'error' && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">
              <strong>Error:</strong> {errorMessage}
            </p>
          </div>
        )}

        {connectionStatus === 'connected' && (
          <div className="space-y-2">
            <p className="font-medium">Database Tables:</p>
            <div className="space-y-1">
              {Object.entries(tablesStatus).map(([table, exists]) => (
                <div key={table} className="flex items-center justify-between">
                  <span className="font-mono text-sm">{table}</span>
                  {getStatusBadge(exists)}
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={testConnection} variant="outline" className="w-full">
          Test Connection Again
        </Button>
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionTest;
