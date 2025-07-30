const [showAddMemberModal, setShowAddMemberModal] = useState(false);
const [addMemberType, setAddMemberType] = useState<'invite' | 'create'>('invite');
const [editingRate, setEditingRate] = useState<{ id: number; rate: number } | null>(null);
const [showPasswordReset, setShowPasswordReset] = useState<{ id: number; name: string } | null>(null);
const [newPassword, setNewPassword] = useState('');
const [inviteForm, setInviteForm] = useState({
  email: '',
  role: 'employee',
}
)