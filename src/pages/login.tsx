import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { CircleDollarSign, LockKeyhole, LoaderCircle, Mail } from 'lucide-react'
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
import { Checkbox } from '@/components/ui/checkbox'
import { useAppDispatch } from '@/store'
import { loginSuccess } from '@/store/slices/auth-slice'
import * as authService from '@/services/auth'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean(),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginPage() {
  const dispatch = useAppDispatch()
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'adaeze.okafor@routelink.io', password: '', remember: true },
  })

  async function completeLogin(values: LoginValues) {
    setSubmitting(true)
    try {
      const session = await authService.login({
        email: values.email,
        password: values.password,
      })
      dispatch(loginSuccess({ user: session.user }))
      toast.success(
        `Welcome back, ${session.user.firstName}`,
        {
          description: `Signed in as ${session.user.access}`,
        },
      )
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to sign in.'
      toast.error('Sign in failed', { description: message })
    } finally {
      setSubmitting(false)
    }
  }

  function quickSignIn(email: string) {
    form.setValue('email', email, { shouldValidate: true })
    form.setValue('password', 'teller-demo-1', { shouldValidate: true })
    void completeLogin(form.getValues())
  }

  const demo = authService.getDemoUsers()

  return (
    <div className="flex min-h-dvh flex-col bg-space-grey">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-orange-950/50">
            <CircleDollarSign className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white">
              RouteLink{' '}
              <span className="font-normal text-white/70">Teller</span>
            </h1>
            <p className="text-sm text-white/50">Secure Teller Console</p>
          </div>
        </div>

        <Card className="w-full max-w-sm border-none shadow-2xl shadow-black/40">
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
                            type="password"
                            placeholder="••••••••"
                            className="pl-9"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <FormField
                    control={form.control}
                    name="remember"
                    render={({ field }) => (
                      <label className="flex cursor-pointer items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        Keep me signed in
                      </label>
                    )}
                  />
                  <button
                    type="button"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

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

        <div className="mt-4 flex w-full max-w-sm flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-white/10" />
            <span className="text-[11px] font-medium tracking-wider text-white/40 uppercase">
              Demo accounts
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => quickSignIn(demo.maker.email)}
              className="rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-left transition-colors hover:bg-white/10"
            >
              <span className="block text-[13px] font-semibold text-white">
                Sign in as Maker
              </span>
              <span className="block text-[11px] text-white/45">
                Initiate transfers
              </span>
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => quickSignIn(demo.checker.email)}
              className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-2.5 text-left transition-colors hover:bg-primary/20"
            >
              <span className="block text-[13px] font-semibold text-white">
                Sign in as Checker
              </span>
              <span className="block text-[11px] text-white/45">
                Approve transfers
              </span>
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-white/40">
          Demo build — enter any password to continue. Roles control access to
          the approval queue.
        </p>
      </div>
    </div>
  )
}