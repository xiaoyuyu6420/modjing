'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type SiteData = {
  id?: number
  name?: string
  url?: string
  logo?: string | null
  description?: string | null
  announcement?: string | null
  isFree?: boolean
  status?: string
  paymentMethods?: string
  hasInvoice?: boolean
  complianceLevel?: string | null
  dataLocation?: string | null
}

export default function SiteForm({ site }: { site?: SiteData }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const isEdit = !!site?.id

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const data: Record<string, unknown> = {}

    formData.forEach((value, key) => {
      if (key === 'isFree' || key === 'hasInvoice') {
        data[key] = value === 'on'
      } else {
        data[key] = value || null
      }
    })
    // Checkbox handling
    data.isFree = formData.has('isFree')
    data.hasInvoice = formData.has('hasInvoice')

    try {
      const url = isEdit ? `/api/admin/sites/${site.id}` : '/api/admin/sites'
      const method = isEdit ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (res.ok) {
        router.push('/admin/sites')
        router.refresh()
      } else {
        const body = await res.json()
        setError(body.error || '操作失败')
      }
    } catch {
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {error && (
        <div className='px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400'>
          {error}
        </div>
      )}

      {/* Basic Info */}
      <fieldset className='bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 space-y-4'>
        <legend className='text-sm font-semibold text-gray-200 px-2'>基本信息</legend>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs text-gray-400 mb-1.5'>站点名称 *</label>
            <input
              name='name'
              required
              defaultValue={site?.name || ''}
              className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
            />
          </div>
          <div>
            <label className='block text-xs text-gray-400 mb-1.5'>站点 URL *</label>
            <input
              name='url'
              required
              defaultValue={site?.url || ''}
              placeholder='https://example.com'
              className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
            />
          </div>
        </div>

        <div>
          <label className='block text-xs text-gray-400 mb-1.5'>Logo URL</label>
          <input
            name='logo'
            defaultValue={site?.logo || ''}
            placeholder='https://example.com/logo.png'
            className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
          />
        </div>

        <div>
          <label className='block text-xs text-gray-400 mb-1.5'>描述</label>
          <textarea
            name='description'
            rows={3}
            defaultValue={site?.description || ''}
            className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none'
          />
        </div>

        <div>
          <label className='block text-xs text-gray-400 mb-1.5'>公告</label>
          <input
            name='announcement'
            defaultValue={site?.announcement || ''}
            placeholder='站点公告信息'
            className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
          />
        </div>
      </fieldset>

      {/* Status & Type */}
      <fieldset className='bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 space-y-4'>
        <legend className='text-sm font-semibold text-gray-200 px-2'>状态与类型</legend>

        <div className='grid grid-cols-3 gap-4'>
          <div>
            <label className='block text-xs text-gray-400 mb-1.5'>状态</label>
            <select
              name='status'
              defaultValue={site?.status || 'online'}
              className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
            >
              <option value='online'>在线</option>
              <option value='unstable'>不稳定</option>
              <option value='offline'>已下线</option>
            </select>
          </div>
          <div>
            <label className='block text-xs text-gray-400 mb-1.5'>支付方式</label>
            <input
              name='paymentMethods'
              defaultValue={site?.paymentMethods || ''}
              placeholder='支付宝,微信,USDT'
              className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
            />
          </div>
          <div className='flex items-end gap-6'>
            <label className='flex items-center gap-2 text-sm text-gray-300 cursor-pointer'>
              <input
                type='checkbox'
                name='isFree'
                defaultChecked={site?.isFree || false}
                className='rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/50'
              />
              免费站
            </label>
            <label className='flex items-center gap-2 text-sm text-gray-300 cursor-pointer'>
              <input
                type='checkbox'
                name='hasInvoice'
                defaultChecked={site?.hasInvoice || false}
                className='rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/50'
              />
              支持发票
            </label>
          </div>
        </div>
      </fieldset>

      {/* Enterprise */}
      <fieldset className='bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 space-y-4'>
        <legend className='text-sm font-semibold text-gray-200 px-2'>企业合规</legend>

        <div className='grid grid-cols-2 gap-4'>
          <div>
            <label className='block text-xs text-gray-400 mb-1.5'>合规等级</label>
            <select
              name='complianceLevel'
              defaultValue={site?.complianceLevel || ''}
              className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
            >
              <option value=''>未设置</option>
              <option value='none'>无</option>
              <option value='basic'>基础</option>
              <option value='iso27001'>ISO 27001</option>
              <option value='mlps2'>等保二级</option>
              <option value='mlps3'>等保三级</option>
            </select>
          </div>
          <div>
            <label className='block text-xs text-gray-400 mb-1.5'>数据位置</label>
            <select
              name='dataLocation'
              defaultValue={site?.dataLocation || ''}
              className='w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50'
            >
              <option value=''>未设置</option>
              <option value='CN'>中国大陆</option>
              <option value='US'>美国</option>
              <option value='EU'>欧洲</option>
              <option value='Mixed'>混合</option>
            </select>
          </div>
        </div>
      </fieldset>

      {/* Actions */}
      <div className='flex items-center gap-3'>
        <button
          type='submit'
          disabled={loading}
          className='px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50'
        >
          {loading ? '保存中...' : isEdit ? '保存修改' : '创建站点'}
        </button>
        <a
          href='/admin/sites'
          className='px-4 py-2.5 text-sm text-gray-400 hover:text-gray-200 transition-colors'
        >
          取消
        </a>
      </div>
    </form>
  )
}
