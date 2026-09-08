import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { Eye, EyeOff, LockKeyhole, LoaderCircle, Mail } from 'lucide-react'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useAppDispatch } from '@/store'
import { loginSuccess } from '@/store/slices/auth-slice'
import * as authService from '@/services/auth'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const dispatch = useAppDispatch()
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  async function completeLogin(values: LoginValues) {
    setSubmitting(true)
    try {
      const session = await authService.login({
        email: values.email,
        password: values.password,
      })
      dispatch(loginSuccess({ user: session.user }))
      toast.success(`Welcome back, ${session.user.firstName || 'there'}`, {
        description: `Signed in as ${session.user.role || 'Teller'}`,
      })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign in.'
      toast.error('Sign in failed', { description: message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-space-grey">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-5 flex flex-col items-center text-center">
            <img
              src="/mfb_assets_logo.png"
              alt="RoutePay logo"
              className="size-36 shrink-0 object-contain"
            />
          </div>

        <Card className="w-full max-w-sm border-none rounded-lg shadow-2xl shadow-black/40">
          <CardContent className="px-6 py-8">
            <div className="mb-6">
              <h2 className="text-lg font-semibold tracking-tight">Sign in</h2>
              <p className="text-sm text-muted-foreground">
                Use your corporate credentials to continue.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(completeLogin)}
                className="grid gap-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Work email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            {...field}
                            placeholder="you@routelink.io"
                            className="pl-9"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <LockKeyhole className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                          <Input
                            {...field}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            className="pl-9 pr-10"
                          />
                          <button
                            type="button"
                            aria-label={
                              showPassword ? 'Hide password' : 'Show password'
                            }
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                          >
                            {showPassword ? (
                              <EyeOff className="size-4" />
                            ) : (
                              <Eye className="size-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="mt-2 w-full"
                  disabled={submitting}
                >
                  {submitting ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : null}
                  {submitting ? 'Signing in…' : 'Sign in to console'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
