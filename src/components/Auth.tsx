<div className="text-center">
  <div className="flex justify-center">
    <div className="bg-blue-600 p-3 rounded-full">
      <Building2 className="h-8 w-8 text-white" />
    </div>
  </div>
  <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
    {showPasswordReset ? 'Reset Your Password' : isLogin ? 'Sign in to your account' : 'Create your organization'}
  </h2>
  <p className="mt-2 text-sm text-gray-600">
    {showPasswordReset
      ? 'Enter your current password and new password'
      : isLogin
        ? 'Access your attendance management system'
        : 'Set up your team\'s attendance tracking'
    }
  </p>
</div>