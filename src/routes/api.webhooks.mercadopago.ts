import { createFileRoute } from '@tanstack/react-router'
import { createClient } from '@supabase/supabase-js'
import process from 'node:process'

export const Route = createFileRoute('/api/webhooks/mercadopago')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        console.log('Webhook Mercado Pago recebido')
        
        try {
          const url = new URL(request.url)
          const dataId = url.searchParams.get('data.id') || url.searchParams.get('id')
          const type = url.searchParams.get('type') || url.searchParams.get('topic')

          console.log('Dados do Webhook:', { dataId, type })

          if (type === 'payment' && dataId) {
            // 1. Configurar Supabase Admin
            const supabaseUrl = process.env.SUPABASE_URL
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
            if (!supabaseUrl || !supabaseKey) {
              throw new Error('Configurações do Supabase ausentes')
            }
            const supabase = createClient(supabaseUrl, supabaseKey)

            // 2. Buscar detalhes do pagamento no Mercado Pago para confirmar o status
            const accessToken = process.env.ACCESS_TOKEN
            if (!accessToken) {
              throw new Error('Mercado Pago ACCESS_TOKEN ausente')
            }

            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            })

            if (!mpResponse.ok) {
              throw new Error(`Erro ao buscar pagamento no MP: ${mpResponse.statusText}`)
            }

            const paymentData = await mpResponse.json()
            console.log('Status do pagamento no MP:', paymentData.status)

            if (paymentData.status === 'approved') {
              const orderId = paymentData.external_reference
              console.log('Confirmando pedido:', orderId)

              if (orderId) {
                const { data, error } = await supabase.rpc('confirm_payment', {
                  p_order_id: orderId,
                  p_external_id: String(dataId)
                })

                if (error) {
                  console.error('Erro ao chamar RPC confirm_payment:', error)
                  throw error
                }
                console.log('Resultado RPC confirm_payment:', data)
              }
            }
          }

          return new Response('OK', { status: 200 })
        } catch (error: any) {
          console.error('Erro no processamento do Webhook:', error.message)
          return new Response(`Erro: ${error.message}`, { status: 500 })
        }
      }
    }
  }
})
