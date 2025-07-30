const Auth: React.FC = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({
    organizationName: '',
    email: '',
    password: '',
  });
  const [signupForm, setSignupForm] = useState({
    organizationName: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [resetForm, setResetForm] = useState({
    organizationName: '',
    email: '',
    oldPassword: '',
    newPassword: '',
  });

  // const handleLogin = async (e: React.FormEvent) => {
  //   e.preventDefault();
};