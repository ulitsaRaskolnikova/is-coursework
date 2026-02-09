import { Route, Routes } from 'react-router';
import WelcomePage from '../pages/WelcomePage.tsx';
import Layout from '../components/layouts/Layout.tsx';
import PublicLayout from '../components/layouts/PublicLayout.tsx';
import CheckDomainPage from '../pages/CheckDomainPage.tsx';
import NotFound from '../pages/NotFound.tsx';
import AuthLayout from '../components/layouts/AuthLayout.tsx';
import SignInPage from '../pages/auth/SignInPage.tsx';
import SignUpPage from '../pages/auth/SignUpPage.tsx';
import ForgetPasswordPage from '../pages/auth/ForgetPasswordPage.tsx';
import CheckEmailPage from '../pages/auth/CheckEmailPage.tsx';
import TFAPage from '../pages/auth/TFAPage.tsx';
import TFATotpPage from '../pages/auth/TFATotpPage.tsx';
import TFAWebAuthnPage from '../pages/auth/TFAWebAuthnPage.tsx';
import VerificateEmailPage from '../pages/auth/VerificateEmailPage.tsx';
import AppLayout from '../components/layouts/AppLayout.tsx';
import DashboardPage from '../pages/app/DashboardPage.tsx';
import DomainsPage from '../pages/app/DomainsPage.tsx';
import EventsPage from '../pages/app/EventsPage.tsx';
import CartPage from '../pages/app/CartPage.tsx';
import DNSPage from '../pages/app/DNSPage.tsx';
import ProfilePage from '../pages/app/ProfilePage.tsx';
import AdminLayout from '~/components/layouts/AdminLayout.tsx';
import AdminDashboardPage from '~/pages/admin/AdminDashboardPage.tsx';
import UsersDomainsPage from '~/pages/admin/UsersDomainsPage.tsx';
import UsersPage from '~/pages/admin/UsersPage.tsx';
import SystemEventsPage from '~/pages/admin/SystemEventsPage.tsx';
import FinancesPage from '~/pages/admin/FinancesPage.tsx';
import ZonesPage from '~/pages/auth/ZonesPage.tsx';

const Index = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={'*'} element={<NotFound fullPage />} />
        <Route path={'/'} element={<PublicLayout />}>
          <Route index element={<WelcomePage />} />
          <Route path={'/check-domain'} element={<CheckDomainPage />} />
        </Route>
        <Route path={'/auth'} element={<AuthLayout />}>
          <Route index element={<NotFound />} />
          <Route path={'sign-in'} element={<SignInPage />} />
          <Route path={'sign-up'} element={<SignUpPage />} />
          <Route path={'forget-password'} element={<ForgetPasswordPage />} />
          <Route path={'check-email'} element={<CheckEmailPage />} />
          <Route path={'verify-email'} element={<VerificateEmailPage />} />
          <Route path={'2fa'} element={<TFAPage />} />
          <Route path={'2fa/totp'} element={<TFATotpPage />} />
          <Route path={'2fa/webauthn'} element={<TFAWebAuthnPage />} />
        </Route>
        <Route path={'/app'} element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path={'domains'} element={<DomainsPage />} />
          <Route path={'events'} element={<EventsPage />} />
          <Route path={'cart'} element={<CartPage />} />
          <Route path={'dns'} element={<DNSPage />} />
          <Route path={'me'} element={<ProfilePage />} />
        </Route>
        <Route path={'/admin'} element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path={'domains'} element={<UsersDomainsPage />} />
          <Route path={'users'} element={<UsersPage />} />
          <Route path={'events'} element={<SystemEventsPage />} />
          <Route path={'finances'} element={<FinancesPage />} />
          <Route path={'me'} element={<ProfilePage />} />
          <Route path={'zones'} element={<ZonesPage />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default Index;
