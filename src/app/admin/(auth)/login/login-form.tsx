'use client';

import { useActionState } from 'react';

import { signInAction, type LoginState } from '@/app/admin/(auth)/actions';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/fields';

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, initialState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <TextField
        label="Email"
        type="email"
        name="email"
        autoComplete="username"
        placeholder="you@example.com"
        required
      />
      <TextField
        label="Password"
        type="password"
        name="password"
        autoComplete="current-password"
        required
      />
      {state.error ? (
        <p role="alert" className="text-sm font-medium text-red-700">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="btn-block" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
