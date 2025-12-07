'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { User, TrendingUp } from 'lucide-react';
import { usePathname } from 'next/navigation';

export default function AuthHeader() {
  const { status } = useSession();
  const pathname = usePathname();
  const isProfilePage = pathname === '/profile';
  
  return (
    <div className="w-full flex justify-end py-3 px-4">
      <div className="flex gap-2">
        {status === 'authenticated' ? (
          <>
            {isProfilePage ? (
              <Link href="/analyze">
                <Button variant="outline" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  분석
                </Button>
              </Link>
            ) : (
              <Link href="/profile">
                <Button variant="outline" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  내정보
                </Button>
              </Link>
            )}
            <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/' })}>
              로그아웃
            </Button>
          </>
        ) : (
          <Link href="/" className="px-4 py-2 border rounded-md">메인</Link>
        )}
      </div>
    </div>
  );
}


