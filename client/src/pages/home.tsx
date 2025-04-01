import ContestList from "@/components/contest/ContestList";
import NotificationSettings from "@/components/notification/NotificationSettings";
import { useAuth } from "@/components/auth/useAuth";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="bg-gray-50 min-h-screen font-sans text-neutral-700">
      <div className="container mx-auto pb-12">
        <ContestList />
        {isAuthenticated && <NotificationSettings />}
      </div>
    </div>
  );
}
