import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import axiosInstance from '@/lib/axios';

export type ModuleAccess = {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

export type SlotAccess = {
  teacherSlot: ModuleAccess;
  slotTemplate: ModuleAccess;
  loading: boolean;
};

const FULL: ModuleAccess = {
  view: true,
  create: true,
  edit: true,
  delete: true
};
const NONE: ModuleAccess = {
  view: false,
  create: false,
  edit: false,
  delete: false
};

// What the signed in user may do in Teacher Slots and Slot Templates. Admin
// may do everything and staff keep what they always had (generate slots,
// manage templates). A teacher's access comes from their designation, read
// from the API each time so a change by an admin applies without a new login.
export function useSlotAccess(): SlotAccess {
  const role = useSelector((state: any) => state.auth?.user?.role);
  const [permissions, setPermissions] = useState<any>(undefined);

  useEffect(() => {
    if (role !== 'teacher') return;
    let cancelled = false;
    axiosInstance
      .get('/designations/my-permissions')
      .then((res) => !cancelled && setPermissions(res.data?.data || null))
      .catch(() => !cancelled && setPermissions(null));
    return () => {
      cancelled = true;
    };
  }, [role]);

  if (role === 'admin')
    return { teacherSlot: FULL, slotTemplate: FULL, loading: false };
  if (role === 'staff')
    return {
      teacherSlot: { view: true, create: true, edit: false, delete: false },
      slotTemplate: FULL,
      loading: false
    };
  if (role === 'teacher')
    return {
      teacherSlot: { ...NONE, ...permissions?.teacherSlot },
      slotTemplate: { ...NONE, ...permissions?.slotTemplate },
      loading: permissions === undefined
    };
  return { teacherSlot: NONE, slotTemplate: NONE, loading: false };
}
