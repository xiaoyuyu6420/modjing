'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'

export async function deleteReview(id: number) {
  await prisma.review.delete({ where: { id } })
  revalidatePath('/admin/reviews')
  revalidatePath('/admin')
  redirect('/admin/reviews')
}
