'use client';

import { signOut, useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthHeader() {
  const { status } = useSession();
  return (
    <div className="w-full flex justify-end py-3 px-4">
      <div className="flex gap-2">
        {status === 'authenticated' ? (
          <Button variant="destructive" onClick={() => signOut({ callbackUrl: '/' })}>로그아웃</Button>
        ) : (
          <Link href="/" className="px-4 py-2 border rounded-md">메인</Link>
        )}
      </div>
    </div>
  );
}


