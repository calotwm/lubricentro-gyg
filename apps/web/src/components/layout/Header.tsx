import { useAuth } from '../../contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex items-center space-x-2">
        <User className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">
          {user?.username || 'User'}
        </span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {user?.role || 'employee'}
        </span>
      </div>

      <button
        onClick={logout}
        className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <LogOut className="w-4 h-4" />
        <span>Logout</span>
      </button>
    </header>
  );
}
