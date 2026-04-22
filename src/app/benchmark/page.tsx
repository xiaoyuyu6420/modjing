import BenchmarkRunner from './_components/benchmark-runner'

export const metadata = {
  title: '批量测速 - 模镜',
  description: '在浏览器中并行测试多个 API 端点的延迟与可用性，Key 永不离开本机。',
}

export default function BenchmarkPage() {
  return (
    <main className='min-h-screen bg-stone-50 text-stone-900'>
      <div className='mx-auto max-w-6xl px-6 py-10'>
        <header className='mb-6'>
          <h1 className='text-3xl font-bold'>批量端点测速</h1>
          <p className='mt-2 text-sm text-stone-500'>
            在你自己的浏览器里并发测试多个 OpenAI 兼容端点的延迟、首字节时间、TPS。
          </p>
        </header>
        <div className='mb-6 rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm text-brand-700'>
          🔒 你的 API Key 仅在本地浏览器中使用，<b>不会发送到模镜服务器</b>。
          所有请求由浏览器直接发往你填写的端点。
        </div>
        <BenchmarkRunner />
      </div>
    </main>
  )
}
