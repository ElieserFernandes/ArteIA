export default async function handler(req,res){
  if(req.method!=='POST') return res.status(405).json({error:'Método não permitido'})
  try{
    const token=process.env.MERCADO_PAGO_ACCESS_TOKEN
    if(!token) return res.status(503).json({error:'Pagamento ainda não configurado. Cadastre MERCADO_PAGO_ACCESS_TOKEN na Vercel.'})
    const {pedido_id,titulo,valor}=req.body||{}
    if(!pedido_id||!valor) return res.status(400).json({error:'Dados do pedido incompletos.'})
    const origin=`https://${req.headers.host}`
    const response=await fetch('https://api.mercadopago.com/checkout/preferences',{
      method:'POST',
      headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json','X-Idempotency-Key':String(pedido_id)},
      body:JSON.stringify({
        items:[{id:String(pedido_id),title:titulo||'Arte profissional',quantity:1,currency_id:'BRL',unit_price:Number(valor)}],
        external_reference:String(pedido_id),
        notification_url:`${origin}/api/mercadopago-webhook`,
        back_urls:{success:`${origin}/acompanhar?id=${pedido_id}&pagamento=sucesso`,pending:`${origin}/acompanhar?id=${pedido_id}&pagamento=pendente`,failure:`${origin}/acompanhar?id=${pedido_id}&pagamento=falhou`},
        auto_return:'approved'
      })
    })
    const data=await response.json()
    if(!response.ok) return res.status(response.status).json({error:data.message||'Erro ao criar pagamento.',details:data})
    return res.status(200).json({id:data.id,init_point:data.init_point||data.sandbox_init_point})
  }catch(error){return res.status(500).json({error:error.message||'Erro interno no pagamento.'})}
}
