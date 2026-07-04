'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Signs the visitor into the shared demo workspace. The demo account is
// intentionally public; it contains sample data only.
export default function DemoButton({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const enterDemo = async () => {
    setLoading(true);
    const result = await signIn('credentials', {
      email: 'demo@themis.app',
      password: 'themis-demo',
      redirect: false,
    });
    if (result?.error) {
      setLoading(false);
      return;
    }
    router.push('/dashboard');
  };

  return (
    <button
      onClick={enterDemo}
      disabled={loading}
      className={
        className ||
        'px-4 py-2 bg-accent hover:bg-accent-hover text-white text-sm font-medium rounded-sm transition-colors disabled:opacity-60'
      }
    >
      {loading ? 'Opening demo…' : 'Try the demo'}
    </button>
  );
}
