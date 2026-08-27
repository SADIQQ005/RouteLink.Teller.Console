import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Building2,
  CalendarDays,
  KeyRound,
  LogOut,
  Mail,
  QrCode,
  ShieldCheck,
  Smartphone,
  UserRound,
} from 'lucide-react'
import { z } from 'zod'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/ui/page-header'
import { logout, updateUser } from '@/store/slices/auth-slice'
import { useAppDispatch, useAppSelector } from '@/store'

const profileSchema = z.object({
  firstName: z.string().min(2, 'Enter your first name'),
  lastName: z.string().min(2, 'Enter your last name'),
  email: z.string().email('Enter a valid email'),
  branch: z.string().min(2, 'Enter your branch'),
})

type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, 'Enter your current password'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/^(?=.*[A-Za-z])(?=.*\d)/, 'Include at least one letter and one number'),
    confirmPassword: z.string(),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type PasswordValues = z.infer<typeof passwordSchema>

const QR_BLOCKS = [
  [1, 1, 1, 0, 1, 1, 0, 1, 1, 1],
  [1, 0, 1, 0, 0, 1, 1, 0, 0, 1],
  [1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
  [0, 0, 0, 0, 1, 1, 0, 1, 0, 0],
  [1, 0, 1, 1, 1, 0, 0, 1, 1, 0],
  [0, 1, 0, 1, 0, 1, 1, 0, 1, 1],
  [1, 1, 1, 0, 1, 1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1, 0, 1, 1, 0, 0],
  [0, 1, 1, 1, 0, 0, 1, 0, 1, 1],
  [1, 0, 1, 0, 1, 1, 0, 1, 1, 0],
]

export function ProfilePage() {
  const dispatch = useAppDispatch()
  const user = useAppSelector((state) => state.auth.user)

  const [twoFactorOpen, setTwoFactorOpen] = useState(false)
  const [code, setCode] = useState('')
  const [enabling, setEnabling] = useState(false)

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      branch: user.branch,
    },
  })

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  function onProfile(values: ProfileValues) {
    dispatch(updateUser(values))
    toast.success('Profile updated', { description: `${values.firstName} ${values.lastName}` })
  }

  function onPassword(_values: PasswordValues) {
    passwordForm.reset()
    toast.success('Password changed', {
      description: 'Use the new password at your next sign-in.',
    })
  }

  function enableTwoFactor() {
    setEnabling(true)
    setTimeout(() => {
      setEnabling(false)
      dispatch(updateUser({ twoFactorEnabled: true }))
      setTwoFactorOpen(false)
      setCode('')
      toast.success('Two-factor authentication enabled', {
        description: 'Your account now requires a 6-digit code at sign-in.',
      })
    }, 900)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Manage your personal details, security and sign-in preferences."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-[15px]">Personal information</CardTitle>
              <CardDescription>
                Your details are shared with branch operations and audit reporting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfile)} className="grid gap-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Work email</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="branch"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Branch</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit">Save changes</Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <KeyRound className="size-4 text-primary" />
                Change password
              </CardTitle>
              <CardDescription>
                Use a strong password you do not reuse on other services.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPassword)} className="grid gap-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current password</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••••" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField
                      control={passwordForm.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="••••••••" />
                          </FormControl>
                          <FormDescription>
                            Min 8 chars, letters & numbers.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={passwordForm.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm new password</FormLabel>
                          <FormControl>
                            <Input {...field} type="password" placeholder="••••••••" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button type="submit" variant="outline">
                      Update password
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px] text-destructive">
                <LogOut className="size-4" />
                Session
              </CardTitle>
              <CardDescription>
                Sign out of this console. A fresh log-in is required before you can
                resume pending approvals.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                onClick={() => {
                  toast.info('You have been signed out')
                  dispatch(logout())
                }}
              >
                <LogOut className="size-4" />
                Log out
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-space-grey text-sidebar-foreground">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <div className="flex size-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground shadow-lg shadow-orange-950/40">
                {user.firstName.charAt(0)}
                {user.lastName.charAt(0)}
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-white/60">{user.role}</p>
                <p className="mt-0.5 flex items-center justify-center gap-1.5 text-xs text-white/50">
                  <Mail className="size-3" /> {user.email}
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge variant="outline" className="bg-primary/15 text-orange">
                  {user.tier} · Tier {user.tier === 'Maker' ? 1 : user.tier === 'Checker' ? 2 : 4}
                </Badge>
                {user.twoFactorEnabled && (
                  <Badge variant="outline" className="bg-emerald-500/15 text-emerald-400">
                    <ShieldCheck className="size-3" /> 2FA on
                  </Badge>
                )}
              </div>
              <Separator className="bg-white/10" />
              <div className="grid w-full gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <Building2 className="size-4 text-white/40" />
                  <span className="text-white/60">{user.branch}</span>
                </div>
                <div className="flex items-center gap-3">
                  <CalendarDays className="size-4 text-white/40" />
                  <span className="text-white/60">Last login · {user.lastLogin}</span>
                </div>
                <div className="flex items-center gap-3">
                  <UserRound className="size-4 text-white/40" />
                  <span className="text-white/60">Member since · Jan 2024</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[15px]">
                <Smartphone className="size-4 text-primary" />
                Two-factor authentication
              </CardTitle>
              <CardDescription>
                Strengthen sign-in security with an authenticator code.
              </CardDescription>
            </CardHeader>
            <CardContent className="gap-4">
              <div className="flex items-center justify-between gap-4 rounded-lg border p-4">
                <div>
                  <p className="text-sm font-medium">
                    {user.twoFactorEnabled ? 'Enabled' : 'Not configured'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {user.twoFactorEnabled
                      ? 'You are prompted for a code at every sign-in.'
                      : 'Add an authenticator app as a second step.'}
                  </p>
                </div>
                <Switch
                  checked={user.twoFactorEnabled}
                  onCheckedChange={(v) => {
                    if (v) setTwoFactorOpen(true)
                    else {
                      dispatch(updateUser({ twoFactorEnabled: false }))
                      toast.info('Two-factor authentication disabled')
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={twoFactorOpen} onOpenChange={setTwoFactorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Set up two-factor authentication
            </DialogTitle>
            <DialogDescription>
              Scan this code with your authenticator app, then confirm with the
              generated 6-digit code.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-4">
            <div className="rounded-xl border p-4">
              <div className="grid grid-cols-10 gap-0.5">
                {QR_BLOCKS.flat().map((v, i) => (
                  <span
                    key={i}
                    className={v ? 'rounded-[2px] bg-space-grey-700' : 'bg-white'}
                    style={{ width: 9, height: 9 }}
                  />
                ))}
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <QrCode className="size-3.5" />
              OtpAuth://routelink.io/teller?issuer=RouteLink
            </p>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 6))}
              placeholder="Enter 6-digit code"
              className="mx-auto max-w-40 text-center font-mono tracking-[0.5em]"
              inputMode="numeric"
            />
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setCode('')}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              disabled={enabling || code.length !== 6}
              onClick={enableTwoFactor}
            >
              {enabling ? 'Enabling…' : 'Confirm & enable'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}