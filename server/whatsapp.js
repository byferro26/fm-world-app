// ---------------------------------------------------------------------------
// Envio de WhatsApp — pronto a ligar, mas ainda sem credenciais reais.
//
// Por omissão usa o formato da WhatsApp Cloud API (Meta), que é a opção
// oficial e mais comum. Para ativar:
//   1. Cria uma conta WhatsApp Business e uma app em developers.facebook.com
//   2. Define no Railway (serviço "app"): WHATSAPP_TOKEN e WHATSAPP_PHONE_ID
//   3. Pronto — as mensagens passam a ser enviadas a sério.
//
// Se preferires outro fornecedor (ex. Twilio, ou um serviço como o
// LetsBot), diz-me qual e o endpoint/token, e adapto esta função — a app
// à volta (comunicações em massa, aviso automático de reuniões) não muda.
// ---------------------------------------------------------------------------

export function whatsappConfigurado() {
  return Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_ID);
}

export async function enviarWhatsApp(numero, texto) {
  if (!whatsappConfigurado()) {
    console.log(`[WhatsApp não configurado] Para ${numero}: ${texto}`);
    return false;
  }
  try {
    const numeroLimpo = String(numero).replace(/[^\d+]/g, "");
    const res = await fetch(`https://graph.facebook.com/v20.0/${process.env.WHATSAPP_PHONE_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: numeroLimpo,
        type: "text",
        text: { body: texto },
      }),
    });
    if (!res.ok) {
      console.error("Falha ao enviar WhatsApp:", await res.text());
      return false;
    }
    return true;
  } catch (e) {
    console.error("Erro ao enviar WhatsApp:", e);
    return false;
  }
}
