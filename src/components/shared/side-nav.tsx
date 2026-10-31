import {
  HomeIcon,
  UsersIcon,
  Settings2Icon,
  FileTextIcon,
  UserIcon,
  ClipboardListIcon,
  ChevronDown,
  Settings2,
  CalendarCheck,
  RefreshCw,
  BookOpenCheck,
  Landmark,
  Users,
  CircleUser,
  Link2,
  AtSign,
  DraftingCompass,
  ClipboardPaste,
  PiggyBank,
  Vault,
  Database,
  Building2,
  GraduationCap,
  CalendarClock,
  LayoutGrid,
  BadgeCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link, useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';
import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { logout } from '@/redux/features/authSlice';
import { useSlotAccess } from '@/hooks/use-slot-access';
const navItems = [
  { icon: HomeIcon, label: 'Dashboard', href: '/admin' },
  {
    icon: ClipboardListIcon,
    label: 'Management',
    href: '/management',
    subItems: [
      { icon: Users, label: 'Agents', href: 'agents' },
      { icon: Link2, label: 'Course Relation', href: 'course-fee' }
    ]
  },
  { icon: UsersIcon, label: 'Students', href: 'students' },
  // { icon: UserIcon, label: 'Enrolled', href: '#' },
  { icon: FileTextIcon, label: 'Invoices', href: 'invoice' },
  { icon: ClipboardPaste, label: 'Remit', href: 'remit' },
  { icon: CalendarClock, label: 'Teacher Slots', href: 'teacher-slots' },
  {
    icon: Settings2Icon,
    label: 'Settings',
    href: '/settings',
    subItems: [
      {
        icon: Settings2,
        label: 'Perameters',
        href: '/settings/',
        subItems: [
          { icon: Landmark, label: 'Institution', href: 'institution' },
          { icon: BookOpenCheck, label: 'Courses', href: 'courses' },
          { icon: RefreshCw, label: 'Terms', href: 'terms' },
          {
            icon: CalendarCheck,
            label: 'Academic Year',
            href: 'academic-year'
          },
          { icon: Vault, label: 'Bank List', href: 'bank-list' },
          { icon: Building2, label: 'Company Details', href: 'company-details' }
        ]
      },
      { icon: CircleUser, label: 'Staffs', href: 'staff' },
      { icon: GraduationCap, label: 'Teachers', href: 'teachers' },
      { icon: LayoutGrid, label: 'Slot Templates', href: 'slot-templates' },
      { icon: BadgeCheck, label: 'Designations', href: 'designations' },
      { icon: AtSign, label: 'Emails', href: 'emails' },
      { icon: DraftingCompass, label: 'Drafts', href: 'drafts' },
      { icon: Database, label: 'Bulk Roll Update', href: 'bulk-roll-update' }
    ]
  }
];
// A teacher only manages the slots assigned to them
const teacherNavItems = [
  { icon: CalendarClock, label: 'My Slots', href: 'my-slots' }
];

const NavItem = ({ item, depth = 0 }) => {
  if (!item) return null; // Ensure no invalid items render
  if (item.subItems) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger className="flex w-full cursor-pointer items-center justify-between">
          <div className="flex items-center space-x-2">
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </div>
        </DropdownMenuSubTrigger>
        <DropdownMenuSubContent className="border-none bg-supperagent">
          {item.subItems.map((subItem) => (
            <NavItem key={subItem.href} item={subItem} depth={depth + 1} />
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuSub>
    );
  }

  return (
    <DropdownMenuItem asChild>
      <Link
        to={item.href}
        className="flex w-full cursor-pointer items-center space-x-2 text-sm font-medium text-white hover:text-supperagent"
      >
        <item.icon className="h-5 w-5" />
        <span>{item.label}</span>
      </Link>
    </DropdownMenuItem>
  );
};

export function SideNav() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user) || null;
  const access = useSlotAccess();

  // Auto logout if user is null
  useEffect(() => {
    if (!user) {
      dispatch(logout()); // Dispatch logout action
      navigate('/'); // Redirect to login page
    }
  }, [user, dispatch, navigate]);

  if (!user) return null; // Prevent rendering if user is missing

  //Filter out Management & Settings for agents
  // const filteredNavItems =
  //   user.role === 'agent'
  //     ? navItems.filter(
  //         (item) => !['Management', 'Settings', 'Invoices'].includes(item.label)
  //       )
  //     : navItems;

  // Agents book slots for their students instead of managing them
  const filterForAgent = (navItems) => [
    ...navItems.filter(
      (item) =>
        !['Management', 'Settings', 'Invoices', 'Teacher Slots'].includes(
          item.label
        )
    ),
    { icon: CalendarCheck, label: 'Book Slot', href: 'book-slot' }
  ];

  const filterForStaff = (navItems, user) => {
    if (!user?.privileges?.management) return navItems; // If no privileges, return default nav

    const management = user.privileges.management;

    return navItems
      .map((item) => {
        if (item.label === 'Management' && item.subItems) {
          const allowedSubItems = item.subItems.filter(
            (subItem) =>
              (subItem.label === 'Agents' && management.agent) ||
              (subItem.label === 'Course Relation' && management.courseRelation)
          );

          return allowedSubItems.length > 0
            ? { ...item, subItems: allowedSubItems }
            : null;
        }

        if (item.label === 'Settings' && item.subItems) {
          const allowedSubItems = item.subItems
            .map((subItem) => {
              if (subItem.label === 'Perameters' && subItem.subItems) {
                const allowedParameters = subItem.subItems.filter(
                  (param) =>
                    (param.label === 'Institution' && management.institution) ||
                    (param.label === 'Courses' && management.course) ||
                    (param.label === 'Terms' && management.term) ||
                    (param.label === 'Academic Year' &&
                      management.academicYear) ||
                    (param.label === 'Bank List' && management.bank)
                );

                return allowedParameters.length > 0
                  ? { ...subItem, subItems: allowedParameters }
                  : null;
              }

              // Staff manage slots, so it follows Teacher Slots and is always shown
              if (subItem.label === 'Slot Templates') return subItem;

              return ['Staffs', 'Emails', 'Drafts'].includes(subItem.label) &&
                management[subItem.label.toLowerCase()]
                ? subItem
                : null;
            })
            .filter(Boolean);

          return allowedSubItems.length > 0
            ? { ...item, subItems: allowedSubItems }
            : null;
        }

        if (item.label === 'Invoices' && !management.invoices) return null;
        if (item.label === 'Remit' && !management.remit) return null;

        return item;
      })
      .filter(Boolean); // Remove null items
  };

  // A teacher's menu comes from their designations only: their own slots
  // always, then "Teacher Slots" (everyone's slots) and "Slot Templates" when
  // a designation lets them view those
  const filterForTeacher = () => [
    ...teacherNavItems,
    ...(access.teacherSlot.view
      ? [{ icon: CalendarClock, label: 'Teacher Slots', href: 'teacher-slots' }]
      : []),
    ...(access.slotTemplate.view
      ? [{ icon: LayoutGrid, label: 'Slot Templates', href: 'slot-templates' }]
      : [])
  ];

  const filteredNavItems =
    user.role === 'teacher'
      ? filterForTeacher()
      : user.role === 'agent'
        ? filterForAgent(navItems)
        : user.role === 'staff'
          ? filterForStaff(navItems, user)
          : navItems;

  return (
    <nav className="flex space-x-6 bg-white px-4 py-4 shadow-sm">
      {filteredNavItems.map((item) => (
        <div key={item.href}>
          {item.subItems ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex cursor-pointer items-center space-x-2 text-sm font-medium text-gray-600 hover:text-supperagent">
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="border-none bg-supperagent">
                {item.subItems.map((subItem) => (
                  <NavItem key={subItem.href} item={subItem} />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              to={item.href}
              className={cn(
                'flex cursor-pointer items-center space-x-2 text-sm font-medium text-gray-600 hover:text-supperagent',
                item.href === '/students' && 'text-supperagent'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          )}
        </div>
      ))}
    </nav>
  );
}
