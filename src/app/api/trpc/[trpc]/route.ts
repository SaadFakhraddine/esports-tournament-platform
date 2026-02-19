import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'
import { appRouter } from '@/server/api/root'
import { createTRPCContext } from '@/server/api/trpc'

async function handler(req: NextRequest) {
  console.log('========== API ROUTE ==========')

  // Clone the request to read body
  const clonedReq = req.clone()
  try {
    const body = await clonedReq.text()
  } catch (e) {
    console.log('Could not parse body:', e)
  }
  console.log('========== END API ROUTE ==========')

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createTRPCContext({ headers: req.headers }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
          console.error(`❌ tRPC failed on ${path ?? '<no-path>'}:`, error)
        }
        : undefined,
  })
}

export { handler as GET, handler as POST }