import ProtectedRoute from '@/components/shared/ProtectedRoute';
import ForgotPassword from '@/pages/auth/forget-password';
import SignUpPage from '@/pages/auth/sign-up';
import NotFound from '@/pages/not-found';
import ProfilePage from '@/pages/profile';
import { Suspense, lazy } from 'react';
import { Navigate, Outlet, useRoutes } from 'react-router-dom';
import NotificationsPage from '@/pages/notification';
import Otp from '@/pages/auth/otp';
import NewPassword from '@/pages/new-password';
import AdminLayout from '@/components/layout/admin-layout';
import StudentsPage from '@/pages/students';
import NewStudentPage from '@/pages/students/new';
import { StudentQuiz } from '@/pages/students/quiz';
import InstitutionsPage from '@/pages/institutions';
import CoursesPage from '@/pages/courses';
import TermsPage from '@/pages/terms';
import AcademicYearPage from '@/pages/academic-year';
import StaffPage from '@/pages/staff';
import AgentsPage from '@/pages/agent';
import CourseRelationPage from '@/pages/course-relation';
import StudentViewPage from '@/pages/students/view';
import EmailConfigPage from '@/pages/emails';
import { DraftsManager } from '@/pages/emails/drafts';
import CourseDetails from '@/pages/courseDetails';
import CommentsPage from '@/pages/comments';
import FollowupsPage from '@/pages/followup';
import CreatorFollowupsPage from '@/pages/creatorfollowup';
import CourseRelationDetails from '@/pages/course-relation/details';
import AgentDetails from '@/pages/agent/details';
import InvoicesPage from '@/pages/invoice';
import StudentListPage from '@/pages/invoice/createInvoice';
import GenerateInvoicePage from '@/pages/invoice/generate';
import { StaffSettings } from '@/pages/staff/settings';
import StudentStatusListPage from '@/pages/invoice/status';
import RemitReportPage from '@/pages/remitreport';
import RemitCreatePage from '@/pages/remitreport/create';
import RemitStatusPage from '@/pages/remitreport/status';
import AgentRemit from '@/pages/agent/remit';
import RemitDetailsPage from '@/pages/invoice/customer/details';
import RemitPage from '@/pages/invoice/customer';
import CustomerPage from '@/pages/invoice/customer';
import CustomerDetailsPage from '@/pages/invoice/customer/details';
import InvoiceGeneratePage from '@/pages/invoice/createInvoice';
import InvoiceStatusListPage from '@/pages/invoice/status';

const SignInPage = lazy(() => import('@/pages/auth/signin'));
const DashboardPage = lazy(() => import('@/pages/dashboard'));

// ----------------------------------------------------------------------

export default function AppRouter() {
  const adminRoutes = [
    {
      path: '/admin',
      element: (
        <AdminLayout>
          <ProtectedRoute>
            <Suspense>
              <Outlet />
            </Suspense>
          </ProtectedRoute>
        </AdminLayout>
      ),
      children: [
        {
          element: <DashboardPage />,
          index: true
        },
        {
          path: 'profile',
          element: <ProfilePage />
        },
        {
          path: 'notifications',
          element: <NotificationsPage />
        },
        {
          path: 'invoice',
          element: <InvoicesPage />
        },
        {
          path: 'invoice/customer',
          element: <CustomerPage />
        },

        {
          path: 'invoice/customer/:id',
          element: <CustomerDetailsPage />
        },

        {
          path: 'invoice/generate',
          element: <InvoiceGeneratePage />
        },
        {
          path: 'invoice/status',
          element: <InvoiceStatusListPage />
        },
        {
          path: 'invoice/editGenerate/:id',
          element: <InvoiceGeneratePage />
        },
     
        {
          path: 'remit',
          element: <RemitReportPage />
        },
        {
          path: 'remit/generate',
          element: <RemitCreatePage />
        },
        {
          path: 'remit/editGenerate/:id',
          element: <RemitCreatePage />
        },
        {
          path: 'remit/status',
          element: <RemitStatusPage />
        },
        // {
        //   path: 'invoice/pdf',
        //   element: <ProfessionalInvoice />
        // },
        {
          path: 'students',
          element: <StudentsPage />
        },
        {
          path: 'students/:id',
          element: <StudentViewPage />
        },
        {
          path: 'students/:id/course/:courseid',
          element: <CourseDetails />
        },
        {
          path: 'students/:id/note/:noteid/comments',
          element: <CommentsPage />
        },
        {
          path: 'followup',
          element: <FollowupsPage />
        },
        {
          path: 'followup/created',
          element: <CreatorFollowupsPage />
        },
        {
          path: 'students/new',
          element: <NewStudentPage />
        },
        {
          path: 'students/quiz',
          element: <StudentQuiz />
        },
        {
          path: 'institution',
          element: <InstitutionsPage />
        },
        {
          path: 'courses',
          element: <CoursesPage />
        },
        {
          path: 'terms',
          element: <TermsPage />
        },
        {
          path: 'academic-year',
          element: <AcademicYearPage />
        },
        {
          path: 'staff',
          element: <StaffPage />
        },
        {
          path: 'staff/:id',
          element: <StaffSettings />
        },

        {
          path: 'agents',
          element: <AgentsPage />
        },
        {
          path: 'agents/:id',
          element: <AgentDetails />
        },
        {
          path: 'agents/:id/remit',
          element: <AgentRemit />
        },
        {
          path: 'course-fee',
          element: <CourseRelationPage />
        },
        {
          path: 'course-fee/:id',
          element: <CourseRelationDetails />
        },
        {
          path: 'emails',
          element: <EmailConfigPage />
        },
        {
          path: 'drafts',
          element: <DraftsManager />
        }
      ]
    }
  ];

  const publicRoutes = [
    {
      path: '/',
      element: <SignInPage />,
      index: true
    },
    {
      path: '/signup',
      element: <SignUpPage />,
      index: true
    },
    {
      path: '/forgot-password',
      element: <ForgotPassword />,
      index: true
    },
    {
      path: '/otp',
      element: <Otp />,
      index: true
    },
    {
      path: '/new-password',
      element: <NewPassword />,
      index: true
    },
    {
      path: '/404',
      element: <NotFound />
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />
    }
  ];

  const routes = useRoutes([...publicRoutes, ...adminRoutes]);

  return routes;
}
