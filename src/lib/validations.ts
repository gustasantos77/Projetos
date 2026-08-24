import { z } from 'zod'

export const signupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[A-Z]/, 'Senha deve conter pelo menos 1 letra maiúscula')
    .regex(/[a-z]/, 'Senha deve conter pelo menos 1 letra minúscula')
    .regex(/[0-9]/, 'Senha deve conter pelo menos 1 número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos 1 caractere especial'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
})

export const signinSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
})

export const createTransactionSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(200),
  amount: z.number().positive('Valor deve ser positivo').max(999999999.99),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), 'Data inválida'),
  categoryId: z.string().optional(),
  bankAccountId: z.string().optional(),
  notes: z.string().max(500).optional(),
  isRecurring: z.boolean().optional(),
  recurringId: z.string().optional(),
})

export const updateTransactionSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1).max(200).optional(),
  amount: z.number().positive().max(999999999.99).optional(),
  type: z.enum(['INCOME', 'EXPENSE', 'TRANSFER']).optional(),
  categoryId: z.string().optional(),
  notes: z.string().max(500).optional(),
})

export const createBudgetSchema = z.object({
  categoryId: z.string().min(1),
  amount: z.number().positive('Valor deve ser positivo').max(999999999.99),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
})

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50),
  type: z.enum(['INCOME', 'EXPENSE']),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
})

export const updateCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(50).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  rules: z.string().max(500).optional(),
})

export const createRecurringSchema = z.object({
  description: z.string().min(1, 'Descrição é obrigatória').max(200),
  amount: z.number().positive('Valor deve ser positivo').max(999999999.99),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  frequency: z.enum(['WEEKLY', 'MONTHLY', 'YEARLY']).optional(),
  dayOfMonth: z.number().int().min(1).max(31).optional(),
  categoryId: z.string().optional(),
})

export const syncActionSchema = z.object({
  action: z.enum(['connect', 'add', 'sync', 'delete']),
  itemId: z.string().optional(),
  bankAccountId: z.string().optional(),
})

export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true
  data: T
} | {
  success: false
  errors: string[]
} {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return {
    success: false,
    errors: result.error.issues.map((issue: { message: string }) => issue.message),
  }
}
