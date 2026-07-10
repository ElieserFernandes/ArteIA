export default async function handler(req,res){
  try{
    const token=process.env.MERCADO_PAGO_ACCESS_TOKEN
    const supabaseUrl=process.env.SUPABASE_URL||process.env.VITE_SUPABASE_URL
    const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY
    if(!token||!supabaseUrl||!serviceKey) return res.status(503).json({error:'Webhook não configurado.'})
    const paymentId=req.query?.['data.id']||req.query?.id||req.body?.data?.id
    if(!paymentId) return res.status(200).json({ok:true})
    const paymentResponse=await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`,{headers:{Authorization:`Bearer ${token}`}})
    const payment=await paymentResponse.json()
    if(!paymentResponse.ok) return res.status(400).json({error:'Pagamento não encontrado.'})
    const pedidoId=payment.external_reference
    if(!pedidoId) return res.status(200).json({ok:true})
    const headers={apikey:serviceKey,Authorization:`Bearer ${serviceKey}`,'Content-Type':'application/json',Prefer:'return=minimal'}
    const statusPagamento=payment.status||'pending'
    await fetch(`${supabaseUrl}/rest/v1/pagamentos?pedido_id=eq.${encodeURIComponent(pedidoId)}`,{method:'PATCH',headers,body:JSON.stringify({status:statusPagamento,forma_pagamento:payment.payment_type_id||payment.payment_method_id||'Mercado Pago'})})
    if(statusPagamento==='approved') await fetch(`${supabaseUrl}/rest/v1/pedidos?id=eq.${encodeURIComponent(pedidoId)}`,{method:'PATCH',headers,body:JSON.stringify({status:'pago'})})
    return res.status(200).json({ok:true})
  }catch(error){return res.status(500).json({error:error.message||'Erro no webhook.'})}
}
