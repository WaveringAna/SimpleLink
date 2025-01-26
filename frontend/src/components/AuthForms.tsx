import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAuth } from '../context/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form'
import { useToast } from '@/hooks/use-toast'

const formSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
})

type FormValues = z.infer<typeof formSchema>

export function AuthForms() {
    const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
    const { login, register } = useAuth()
    const { toast } = useToast()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    const onSubmit = async (values: FormValues) => {
        try {
            if (activeTab === 'login') {
                await login(values.email, values.password)
            } else {
                await register(values.email, values.password)
            }
            form.reset()
        } catch (err: any) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: err.response?.data?.error || 'An error occurred',
            })
        }
    }

    return (
        <Card className="w-full max-w-md mx-auto p-6">
            <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as 'login' | 'register')}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Login</TabsTrigger>
                    <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
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

                            <Button type="submit" className="w-full">
                                {activeTab === 'login' ? 'Sign in' : 'Create account'}
                            </Button>
                        </form>
                    </Form>
                </TabsContent>
            </Tabs>
        </Card>
    )
}