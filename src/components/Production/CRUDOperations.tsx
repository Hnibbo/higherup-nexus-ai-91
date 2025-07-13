import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface CRUDHookOptions {
  table: string;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
  realTimeUpdates?: boolean;
}

export const useCRUD = ({ table, onSuccess, onError, realTimeUpdates = false }: CRUDHookOptions) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);

  const create = async (payload: any) => {
    if (!user) return { error: 'User not authenticated' };

    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from(table as any)
        .insert({ ...payload, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      setData(prev => [result, ...prev]);
      onSuccess?.(result);
      
      toast({
        title: "Created successfully",
        description: `New ${table.slice(0, -1)} has been created.`,
      });

      return { data: result, error: null };
    } catch (error: any) {
      onError?.(error);
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const read = async (filters: any = {}, options: any = {}) => {
    setLoading(true);
    try {
      let query = supabase.from(table as any).select(options.select || '*');

      // Apply user filter if user is authenticated
      if (user) {
        query = query.eq('user_id', user.id);
      }

      // Apply additional filters
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });

      // Apply ordering
      if (options.orderBy) {
        query = query.order(options.orderBy.column, { 
          ascending: options.orderBy.ascending !== false 
        });
      }

      // Apply limit
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: result, error } = await query;

      if (error) throw error;

      setData(result || []);
      return { data: result, error: null };
    } catch (error: any) {
      onError?.(error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const update = async (id: string, payload: any) => {
    if (!user) return { error: 'User not authenticated' };

    setLoading(true);
    try {
      const { data: result, error } = await supabase
        .from(table as any)
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setData(prev => prev.map(item => item.id === id ? result : item));
      onSuccess?.(result);
      
      toast({
        title: "Updated successfully",
        description: `${table.slice(0, -1)} has been updated.`,
      });

      return { data: result, error: null };
    } catch (error: any) {
      onError?.(error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    setLoading(true);
    try {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setData(prev => prev.filter(item => item.id !== id));
      
      toast({
        title: "Deleted successfully",
        description: `${table.slice(0, -1)} has been deleted.`,
      });

      return { error: null };
    } catch (error: any) {
      onError?.(error);
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const bulkCreate = async (items: any[]) => {
    if (!user) return { error: 'User not authenticated' };

    setLoading(true);
    try {
      const payload = items.map(item => ({ ...item, user_id: user.id }));
      const { data: result, error } = await supabase
        .from(table as any)
        .insert(payload)
        .select();

      if (error) throw error;

      setData(prev => [...(result || []), ...prev]);
      
      toast({
        title: "Bulk creation successful",
        description: `${items.length} ${table} have been created.`,
      });

      return { data: result, error: null };
    } catch (error: any) {
      onError?.(error);
      toast({
        title: "Bulk creation failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const bulkUpdate = async (updates: { id: string; data: any }[]) => {
    if (!user) return { error: 'User not authenticated' };

    setLoading(true);
    try {
      const promises = updates.map(({ id, data: updateData }) =>
        supabase
          .from(table as any)
          .update(updateData)
          .eq('id', id)
          .eq('user_id', user.id)
          .select()
          .single()
      );

      const results = await Promise.all(promises);
      const errors = results.filter(r => r.error).map(r => r.error);
      
      if (errors.length > 0) {
        throw new Error(`${errors.length} updates failed`);
      }

      const updatedItems = results.map(r => r.data).filter(Boolean) as any[];
      setData(prev => prev.map(item => {
        const updated = updatedItems.find(u => u?.id === item.id);
        return updated || item;
      }));

      toast({
        title: "Bulk update successful",
        description: `${updatedItems.length} ${table} have been updated.`,
      });

      return { data: updatedItems, error: null };
    } catch (error: any) {
      onError?.(error);
      toast({
        title: "Bulk update failed",
        description: error.message,
        variant: "destructive",
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  const bulkDelete = async (ids: string[]) => {
    if (!user) return { error: 'User not authenticated' };

    setLoading(true);
    try {
      const { error } = await supabase
        .from(table as any)
        .delete()
        .in('id', ids)
        .eq('user_id', user.id);

      if (error) throw error;

      setData(prev => prev.filter(item => !ids.includes(item.id)));
      
      toast({
        title: "Bulk deletion successful",
        description: `${ids.length} ${table} have been deleted.`,
      });

      return { error: null };
    } catch (error: any) {
      onError?.(error);
      toast({
        title: "Bulk deletion failed",
        description: error.message,
        variant: "destructive",
      });
      return { error };
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    create,
    read,
    update,
    delete: deleteRecord,
    bulkCreate,
    bulkUpdate,
    bulkDelete,
    refresh: () => read()
  };
};