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

function buildData(fd: FormData): Prisma.SiteUncheckedCreateInput {
  return {
    name: str(fd, 'name'),
    url: str(fd, 'url'),
    logo: str(fd, 'logo') || null,
    description: str(fd, 'description') || null,
    announcement: str(fd, 'announcement') || null,
    isFree: bool(fd, 'isFree'),
    status: str(fd, 'status') || 'online',
    paymentMethods: str(fd, 'paymentMethods'),
    hasInvoice: bool(fd, 'hasInvoice'),
    invoiceTypes: str(fd, 'invoiceTypes'),
    invoiceProvider: str(fd, 'invoiceProvider') || null,
    complianceLevel: str(fd, 'complianceLevel') || null,
    complianceProof: str(fd, 'complianceProof') || null,
    dataLocation: str(fd, 'dataLocation') || null,
    dataRetention: str(fd, 'dataRetention') || null,
    hasEnterpriseAccount: bool(fd, 'hasEnterpriseAccount'),
    hasSubAccounts: bool(fd, 'hasSubAccounts'),
    slaUptime: numOrNull(fd, 'slaUptime'),
    slaResponseTime: numOrNull(fd, 'slaResponseTime'),
    has24x7Support: bool(fd, 'has24x7Support'),
    hasContractTemplate: bool(fd, 'hasContractTemplate'),
    contractProcess: str(fd, 'contractProcess') || null,
    minContractAmount: numOrNull(fd, 'minContractAmount'),
  }
}

function touch(id?: number) {
  revalidatePath('/admin/sites')
  revalidatePath('/admin')
  revalidatePath('/sites')
  if (id) {
    revalidatePath(`/sites/${id}`)
    revalidatePath(`/admin/sites/${id}`)
  }
}

export async function createSite(fd: FormData) {
  await prisma.site.create({ data: buildData(fd) })
  touch()
  redirect('/admin/sites')
}

export async function updateSite(id: number, fd: FormData) {
  await prisma.site.update({ where: { id }, data: buildData(fd) })
  touch(id)
  redirect('/admin/sites')
}

export async function deleteSite(id: number) {
  await prisma.site.delete({ where: { id } })
  touch(id)
  redirect('/admin/sites')
}

export async function setSiteStatus(id: number, status: string) {
  await prisma.site.update({ where: { id }, data: { status } })
  touch(id)
}
