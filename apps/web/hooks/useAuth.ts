import { useAuth as useClerkAuth, useUser } from "@clerk/nextjs";

export function useAuth() {
  const { getToken, isSignedIn } = useClerkAuth();
  const { isLoaded, user} = useUser();

  return {
    isAuthenticated: !!isSignedIn,
    user,
    isLoaded,
    isSignedIn,
    userId: user?.id || null, // Add this line
    getToken
  };
}