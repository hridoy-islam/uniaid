import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { BlinkingDots } from '@/components/shared/blinking-dots';
import axiosInstance from '@/lib/axios';
import {
  DESIGNATION_ACTIONS,
  DESIGNATION_MODULES,
  failToast
} from '@/pages/designations';

type Permissions = Record<string, Record<string, boolean>>;

// Every module and action, read from the designation and false when missing
const toPermissions = (stored?: Permissions): Permissions =>
  Object.fromEntries(
    DESIGNATION_MODULES.map((m) => [
      m.key,
      Object.fromEntries(
        DESIGNATION_ACTIONS.map((a) => [a.key, !!stored?.[m.key]?.[a.key]])
      )
    ])
  );

// What one designation may do in Teacher Slots and Slot Templates
export default function DesignationAccessPage() {
  const { id } = useParams();
  const [designation, setDesignation] = useState<any>(null);
  const [permissions, setPermissions] = useState<Permissions>(toPermissions);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchDesignation = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`/designations/${id}`);
      setDesignation(res.data?.data || null);
      setPermissions(toPermissions(res.data?.data?.permissions));
    } catch (error) {
      failToast('Could not load designation', error);
      setDesignation(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDesignation();
  }, [fetchDesignation]);

  // Creating, editing or deleting needs the page, so they turn View on, and
  // turning View off turns them off
  const toggle = (module: string, action: string, checked: boolean) =>
    setPermissions((current) => {
      const next = { ...current[module], [action]: checked };
      if (action === 'view' && !checked)
        DESIGNATION_ACTIONS.forEach((a) => (next[a.key] = false));
      if (action !== 'view' && checked) next.view = true;
      return { ...current, [module]: next };
    });

  const changed =
    !!designation &&
    JSON.stringify(permissions) !==
      JSON.stringify(toPermissions(designation.permissions));

  const save = async () => {
    setSaving(true);
    try {
      const res = await axiosInstance.patch(`/designations/${id}`, {
        permissions
      });
      setDesignation(res.data?.data || designation);
      toast({
        title: 'Access control updated',
        className: 'bg-supperagent border-none text-white'
      });
    } catch (error) {
      failToast('Could not update access control', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-supperagent" />
            <h1 className="text-2xl font-semibold">
              Access Control
              {designation?.name ? ` · ${designation.name}` : ''}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">

        <Link to="/admin/designations">
            <Button
              size="sm"
              className="h-9 bg-supperagent text-white shadow-sm hover:bg-supperagent/90"
              aria-label="Back to designations"
              >
              <ArrowLeft className="h-4 w-4 mr-2" />Back
            </Button>
          </Link>
        {designation && (
          <Button
          size="sm"
          className="h-9 bg-supperagent text-white shadow-sm hover:bg-supperagent/90"
          disabled={!changed || saving}
          onClick={save}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        )}
      </div>
        </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <BlinkingDots size="large" color="bg-supperagent" />
        </div>
      ) : !designation ? (
        <div className="rounded-xl border border-dashed border-black/10 bg-white py-16 text-center font-semibold">
          Designation not found
        </div>
      ) : (
        <div className="rounded-xl border border-black/10 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto rounded-lg border border-black/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10">
                  <th className="px-4 py-3 text-left font-semibold">Module</th>
                  {DESIGNATION_ACTIONS.map((a) => (
                    <th
                      key={a.key}
                      className="px-4 py-3 text-center font-semibold"
                    >
                      {a.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-black/10">
                {DESIGNATION_MODULES.map((m) => (
                  <tr key={m.key}>
                    <td className="px-4 py-3 font-medium">{m.label}</td>
                    {DESIGNATION_ACTIONS.map((a) => (
                      <td key={a.key} className="px-4 py-3 text-center">
                        <Checkbox
                          checked={!!permissions[m.key]?.[a.key]}
                          onCheckedChange={(checked) =>
                            toggle(m.key, a.key, checked === true)
                          }
                          aria-label={`${m.label} ${a.label}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-black">
            Create, Edit and Delete include View. Teachers with this designation
            get the change straight away.
          </p>
        </div>
      )}
    </div>
  );
}
