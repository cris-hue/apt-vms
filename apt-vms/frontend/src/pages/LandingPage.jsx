import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="mx-auto max-w-7xl px-6 py-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">SecureNest</h1>
          <p className="text-slate-300 mt-1">Apartment Visitor Management System</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/login"
            className="rounded-full border border-slate-600 bg-slate-900/60 px-5 py-2 text-sm font-semibold transition hover:bg-slate-800"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Register
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <section className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-4 py-2 text-sm text-slate-200 ring-1 ring-slate-700">
              <span className="h-2 w-2 rounded-full bg-green-400" /> Live apartment visitor tracking
            </div>

            <div className="space-y-6">
              <h2 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
                Welcome to SecureNest
              </h2>
              <p className="max-w-xl text-lg leading-8 text-slate-300">
                Manage visitor access, approve guests instantly, and keep your apartment community secure with the modern visitor management tool built for admins, tenants, and guards.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-500"
              >
                Get Started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-2xl border border-slate-600 bg-slate-900/80 px-6 py-3 text-base font-semibold text-white transition hover:border-slate-500"
              >
                Sign In
              </Link>
            </div>
          </div>

          <div className="rounded-4xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl shadow-slate-950/40">
            <div className="space-y-6">
              <div className="rounded-3xl bg-slate-950/80 p-6 ring-1 ring-slate-800">
                <p className="text-sm uppercase tracking-[0.24em] text-blue-400">Visitor Portal</p>
                <h3 className="mt-4 text-3xl font-semibold">Fast approval flow</h3>
                <p className="mt-3 text-slate-400">
                  Approve or reject visitor requests in seconds. Generate secure guest passes and let your guard team verify visitor details instantly.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-slate-950/80 p-5 ring-1 ring-slate-800">
                  <p className="text-sm font-semibold text-slate-300">Smart visitor tracking</p>
                  <p className="mt-2 text-sm text-slate-400">Know who enters and exits your building at a glance.</p>
                </div>
                <div className="rounded-3xl bg-slate-950/80 p-5 ring-1 ring-slate-800">
                  <p className="text-sm font-semibold text-slate-300">Multi-role access</p>
                  <p className="mt-2 text-sm text-slate-400">Separate dashboards for admins, tenants, and guards.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 grid gap-8 lg:grid-cols-3">
          <div className="rounded-3xl bg-slate-900/80 p-8 ring-1 ring-slate-800">
            <h3 className="text-xl font-semibold text-white">Admin Control</h3>
            <p className="mt-3 text-slate-400">
              Configure community access, review visitor reports, and keep visitor history organized in one place.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-8 ring-1 ring-slate-800">
            <h3 className="text-xl font-semibold text-white">Tenant Convenience</h3>
            <p className="mt-3 text-slate-400">
              Invite guests, manage visitor requests, and monitor arrival status from your dashboard.
            </p>
          </div>
          <div className="rounded-3xl bg-slate-900/80 p-8 ring-1 ring-slate-800">
            <h3 className="text-xl font-semibold text-white">Guard Verification</h3>
            <p className="mt-3 text-slate-400">
              Validate visitor passes quickly and ensure only authorized guests enter your property.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LandingPage;
