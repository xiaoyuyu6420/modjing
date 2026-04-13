'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export async function deleteHealth(id: number) {
  await prisma.healthCheck.delete({ where: { id } })
  revalidatePath('/admin/health')
  revalidatePath('/admin')
  redirect('/admin/health')
}
