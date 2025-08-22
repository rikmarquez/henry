import { createContext, useContext, ReactNode } from 'react';
import { useAuthStore } from '../stores/authStore';

interface Branch {
  id: number;
  name: string;
  code: string;
  city: string;
}

interface BranchContextType {
  currentBranch: Branch | null;
  isAdmin: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

interface BranchProviderProps {
  children: ReactNode;
}

export function BranchProvider({ children }: BranchProviderProps) {
  const { user } = useAuthStore();

  // Extract branch info from user data
  const currentBranch = user?.branch ? {
    id: user.branch.id,
    name: user.branch.name,
    code: user.branch.code,
    city: user.branch.city,
  } : null;

  // Check if user is admin
  const isAdmin = user?.role?.name === 'ADMIN';

  const value: BranchContextType = {
    currentBranch,
    isAdmin,
  };

  return (
    <BranchContext.Provider value={value}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const context = useContext(BranchContext);
  if (context === undefined) {
    throw new Error('useBranch must be used within a BranchProvider');
  }
  return context;
}

// Hook to get current branch ID for API calls
export function useCurrentBranchId(): number | null {
  const { currentBranch } = useBranch();
  return currentBranch?.id || null;
}

// Hook to check if user can access branch management
export function useCanManageBranches(): boolean {
  const { isAdmin } = useBranch();
  return isAdmin;
}