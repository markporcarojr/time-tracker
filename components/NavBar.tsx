// components/NavBar.tsx  (Server Component)
import Link from "next/link";
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";
import { checkUser } from "@/lib/auth/checkUser";

export default async function NavBar() {
  const user = await checkUser(); // ✅ can now run server code here

  return (
    <nav className="flex items-center justify-between px-4 py-2 bg-gray-900 text-white">
      {/* Left side - Logo / App name */}
      <Link href="/" className="text-lg font-bold hover:text-yellow-400">
        ⏱ CNC Time Tracker
      </Link>

      {/* Right side - Nav links + Auth */}
      <div className="flex items-center gap-4">
        <Link href="/jobs" className="hover:text-yellow-400">
          Jobs
        </Link>
        <Link href="/sessions" className="hover:text-yellow-400">
          Sessions
        </Link>

        <SignedIn>
          <UserButton />
        </SignedIn>

        <SignedOut>
          <SignInButton>
            <button className="px-3 py-1 bg-yellow-500 text-black rounded hover:bg-yellow-400">
              Sign In
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </nav>
  );
}
