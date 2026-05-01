'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

function str(fd: FormData, k: string) {
  return String(fd.get(k) ?? '').trim()
}
function numOrNull(fd: FormData, k: string): number | null {
  const v = str(fd, k)
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
function bool(fd: FormData, k: string) {
  return fd.get(k) === 'on'
}

function buildPrice(fd: FormData): Prisma.SiteModelPriceUncheckedUpdateInput {
  const data: Prisma.SiteModelPriceUncheckedUpdateInput = {
    price: Number(str(fd, 'price') || 0),
    priceOutput: numOrNull(fd, 'priceOutput'),
    priceCached: numOrNull(fd, 'priceCached'),
    priceCacheCreate: numOrNull(fd, 'priceCacheCreate'),
    multiplier: numOrNull(fd, 'multiplier') ?? 1,
    priceUnit: str(fd, 'priceUnit') || 'per_million_tokens',
    afterSales: str(fd, 'afterSales') || 'none',
    detectedModel: str(fd, 'detectedModel') || null,
    tampered: bool(fd, 'tampered'),
    priceAnomaly: bool(fd, 'priceAnomaly'),
    passRate: numOrNull(fd, 'passRate'),
    onlineRate: numOrNull(fd, 'onlineRate'),
    fakeRateBand: str(fd, 'fakeRateBand') || null,
    avgLatencyMs: numOrNull(fd, 'avgLatencyMs'),
    weightedScore: numOrNull(fd, 'weightedScore'),
  }
  return data
}

function touch(id?: number) {
  revalidatePath('/admin/prices')
  revalidatePath('/admin')
  if (id) revalidatePath(`/admin/prices/${id}`)
}

export async function updatePrice(id: number, fd: FormData) {
  await prisma.siteModelPrice.update({ where: { id }, data: buildPrice(fd) })
  touch(id)
  redirect('/admin/prices')
}

export async function deletePrice(id: number) {
  await prisma.siteModelPrice.delete({ where: { id } })
  touch(id)
  redirect('/admin/prices')
}

export async function setPriceFlag(
  id: number,
  field: 'tampered' | 'priceAnomaly',
  value: boolean,
) {
  await prisma.siteModelPrice.update({ where: { id }, data: { [field]: value } })
  touch(id)
}
