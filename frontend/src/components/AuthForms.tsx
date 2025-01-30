import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'
import { checkFirstUser } from '../api/client'

const formSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    adminToken: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

export function AuthForms() {
    const [isFirstUser, setIsFirstUser] = useState<boolean | null>(null)
    const { login, register } = useAuth()
    const { toast } = useToast()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
            adminToken: '',
        },
    })

    useEffect(() => {
        const init = async () => {
            try {
                const isFirst = await checkFirstUser()
                setIsFirstUser(isFirst)
            } catch (err) {
                console.error('Error checking first user:', err)
                setIsFirstUser(false)
            }
        }

        init()
    }, [])

    const onSubmit = async (values: FormValues) => {
        try {
            if (isFirstUser) {
                await register(values.email, values.password, values.adminToken || '')
            } else {
                await login(values.email, values.password)
            }
            form.reset()
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.response?.data || 'An error occurred',
            })
        }
    }

    if (isFirstUser === null) {
        return <div>Loading...</div>
    }

    return (
        <Card className="w-full max-w-md mx-auto p-6">
            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold">
                    {isFirstUser ? 'Create Admin Account' : 'Login'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    {isFirstUser
                        ? 'Set up your admin account to get started'
                        : 'Welcome back! Please login to your account'}
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" {...field} />
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
                                    <Input type="password" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {isFirstUser && (
                        <FormField
                            control={form.control}
                            name="adminToken"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Admin Setup Token</FormLabel>
                                    <FormControl>
                                        <Input type="text" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    )}

                    <Button type="submit" className="w-full">
                        {isFirstUser ? 'Create Account' : 'Sign in'}
                    </Button>
                </form>
            </Form>
        </Card>
    )
}
