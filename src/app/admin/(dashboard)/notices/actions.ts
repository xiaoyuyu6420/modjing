'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function str(fd: FormData, k: string) {
  return String(fd.get(k) ?? '').trim()
}

function build(fd: FormData): Prisma.RelayNoticeUncheckedCreateInput {
  const siteId = Number(fd.get('siteId'))
  const published = str(fd, 'publishedAt')
  return {
    siteId,
    sourceType: str(fd, 'sourceType') || 'manual',
    noticeText: str(fd, 'noticeText'),
    noticeUrl: str(fd, 'noticeUrl') || null,
    tagCategory: str(fd, 'tagCategory') || 'notice',
    publishedAt: published ? new Date(published) : null,
  }
}

function touch(id?: number) {
  revalidatePath('/admin/notices')
  revalidatePath('/admin')
  if (id) revalidatePath(`/admin/notices/${id}`)
}

export async function createNotice(fd: FormData) {
  await prisma.relayNotice.create({ data: build(fd) })
  touch()
  redirect('/admin/notices')
}

export async function updateNotice(id: number, fd: FormData) {
  await prisma.relayNotice.update({ where: { id }, data: build(fd) })
  touch(id)
  redirect('/admin/notices')
}

export async function deleteNotice(id: number) {
  await prisma.relayNotice.delete({ where: { id } })
  touch(id)
  redirect('/admin/notices')
}
