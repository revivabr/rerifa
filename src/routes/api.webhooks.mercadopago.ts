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
          // Mercado Pago envia o ID via query param ou body dependendo da versão/tópico
          // No histórico vimos: data.id=163675738104&type=payment OU id=163675738104&topic=payment
          const dataId = url.searchParams.get('data.id') || url.searchParams.get('id')
          const type = url.searchParams.get('type') || url.searchParams.get('topic')

          console.log('Dados do Webhook (Query):', { dataId, type })

          // Se não estiver na query, pode estar no body
          let bodyData: any = {}
          if (!dataId || !type) {
            try {
              bodyData = await request.json()
              console.log('Dados do Webhook (Body):', bodyData)
            } catch (e) {
              // Ignore body parsing error if not JSON
            }
          }

          const finalId = dataId || bodyData.data?.id || bodyData.id
          const finalType = type || bodyData.type || bodyData.topic

          if (finalType === 'payment' && finalId) {
            // 1. Configurar Supabase Admin
            const supabaseUrl = process.env.SUPABASE_URL
            const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
            if (!supabaseUrl || !supabaseKey) {
              throw new Error('Configurações do Supabase (URL ou SERVICE_ROLE_KEY) ausentes no servidor')
            }
            const supabase = createClient(supabaseUrl, supabaseKey)

            // 2. Buscar detalhes do pagamento no Mercado Pago para confirmar o status
            const accessToken = process.env.ACCESS_TOKEN
            if (!accessToken) {
              throw new Error('Mercado Pago ACCESS_TOKEN ausente no servidor')
            }

            console.log(`Buscando detalhes do pagamento ${finalId} no Mercado Pago...`)
            const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${finalId}`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            })

            if (!mpResponse.ok) {
              const errorText = await mpResponse.text()
              throw new Error(`Erro ao buscar pagamento no MP: ${mpResponse.status} ${errorText}`)
            }

            const paymentData = await mpResponse.json()
            console.log('Status do pagamento no MP:', paymentData.status)

            if (paymentData.status === 'approved') {
              const orderId = paymentData.external_reference
              console.log('Confirmando pedido:', orderId)

              if (orderId) {
                const { data, error } = await supabase.rpc('confirm_payment', {
                  p_order_id: orderId,
                  p_external_id: String(finalId)
                })

                if (error) {
                  console.error('Erro ao chamar RPC confirm_payment:', error)
                  throw error
                }
                console.log('Resultado RPC confirm_payment:', data)
              } else {
                console.warn('Pagamento aprovado mas external_reference (orderId) ausente')
              }
            } else {
              console.log(`Pagamento ${finalId} com status ${paymentData.status}. Nenhuma ação necessária.`)
            }
          } else {
            console.log('Webhook ignorado: tipo ou ID não identificados como pagamento', { finalType, finalId })
          }

          return new Response('OK', { status: 200 })
        } catch (error: any) {
          console.error('Erro crítico no processamento do Webhook:', error.message)
          // Retornamos 200 mesmo em erro de lógica para o MP parar de tentar, 
          // a menos que queiramos que ele tente novamente (neste caso 500 é melhor)
          return new Response(`Erro: ${error.message}`, { status: 500 })
        }
      }
    }
  }
})
