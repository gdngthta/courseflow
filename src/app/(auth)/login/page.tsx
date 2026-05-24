import { OwlMascot } from '@/components/brand/OwlMascot'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <OwlMascot size={88} variant="reading" className="opacity-90" />
          <div className="text-center">
            <h1 className="text-xl font-bold text-white tracking-tight">CourseFlow</h1>
            <p className="text-xs text-slate-500 mt-0.5">Your academic productivity companion</p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h1 className="text-lg font-semibold text-white mb-1">Sign in</h1>
          <p className="text-sm text-slate-400 mb-6">Welcome back. Sign in to continue.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                placeholder="you@university.edu"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
              />
            </div>
            <button className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-lg transition-colors">
              Sign In
            </button>
          </div>

          <p className="text-center text-xs text-slate-500 mt-4">
            Auth not connected yet — coming in Phase 3.
          </p>
        </div>
      </div>
    </div>
  )
}
