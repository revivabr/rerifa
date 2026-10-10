import type { getWinnerDocument } from "@/lib/api/draw.functions";
import { formatBRL, padNumber } from "@/lib/format";

type WinnerDocument = Awaited<ReturnType<typeof getWinnerDocument>>;
export function drawDateTime(value: string | null): string {
  return value ? new Date(value).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "medium" }) : "Não registrado";
}

export async function generateWinnerPDF(data: WinnerDocument, artwork: "banner" | "prize") {
  const { jsPDF } = await import("jspdf");
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const canvas = document.createElement("canvas");
  canvas.width = 1240; canvas.height = 1754;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível criar o documento.");
  const css = getComputedStyle(document.documentElement);
  const color = (token: string) => css.getPropertyValue(token).trim();
  const primary = color("--color-primary"); const gold = color("--color-gold");
  const paper = color("--color-sand"); const ink = color("--color-primary");
  const headingFont = css.getPropertyValue("--font-display").trim() || "sans-serif";
  const bodyFont = css.getPropertyValue("--font-sans").trim() || "sans-serif";
  await document.fonts.ready;
  const text = (value: string, x: number, y: number, size = 28, bold = false, align: CanvasTextAlign = "left", fill = ink) => {
    ctx.fillStyle = fill; ctx.font = `${bold ? 700 : 400} ${size}px ${bold ? headingFont : bodyFont}`;
    ctx.textAlign = align; ctx.fillText(value, x, y);
  };
  const wrap = (value: string, width: number, size = 28, bold = false) => {
    ctx.font = `${bold ? 700 : 400} ${size}px ${bold ? headingFont : bodyFont}`;
    const lines: string[] = []; let line = "";
    for (const word of value.split(/\s+/)) {
      if (ctx.measureText(word).width > width) {
        if (line) { lines.push(line); line = ""; }
        let chunk = "";
        for (const character of word) {
          if (ctx.measureText(chunk + character).width > width) { lines.push(chunk); chunk = ""; }
          chunk += character;
        }
        line = chunk;
      } else if (line && ctx.measureText(`${line} ${word}`).width > width) { lines.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line);
    return lines;
  };
  const base = (page: number) => {
    ctx.fillStyle = paper; ctx.fillRect(0, 0, 1240, 1754);
    ctx.strokeStyle = gold; ctx.lineWidth = 3; ctx.strokeRect(35, 35, 1170, 1684);
    ctx.fillStyle = primary; ctx.fillRect(35, 35, 1170, 112);
    text("ASSOCIAÇÃO REVIVA BRASIL", 620, 103, 32, true, "center", paper);
    text("rifa.revivabrasil.com.br", 620, 1664, 22, false, "center");
    text(`${page} • Horários de Brasília (UTC−3)`, 620, 1696, 18, false, "center");
  };
  const addPage = () => pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", 0, 0, 210, 297);
  base(1);
  text("UM NÚMERO. UMA HISTÓRIA. UM GRANDE MOMENTO.", 620, 204, 23, true, "center", primary);
  const imageUrl = artwork === "banner" ? data.campaign.banner_url : data.prize?.image_url ?? data.campaign.prize_image_1;
  if (!imageUrl) throw new Error("Cadastre a imagem escolhida antes de gerar o PDF.");
  // Admin-only signed artwork is never persisted in the public winner document endpoint.
  const image = new Image(); image.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve(); image.onerror = () => reject(new Error("Não foi possível carregar a arte. Tente outra imagem.")); image.src = imageUrl;
  });
  const ratio = Math.min(1096 / image.width, 560 / image.height);
  ctx.drawImage(image, (1240 - image.width * ratio) / 2, 242 + (560 - image.height * ratio) / 2, image.width * ratio, image.height * ratio);
  text("CERTIFICADO DO GANHADOR", 620, 862, 25, true, "center", gold);
  text("Parabéns!", 620, 947, 78, true, "center");
  let nameY = 1010;
  const nameLines = wrap(data.order.buyers.name, 1040, 44, true);
  for (const line of nameLines) { text(line, 620, nameY, 44, true, "center"); nameY += 52; }
  const numberY = Math.max(1100, nameY + 28);
  text("SEU NÚMERO SORTEADO", 620, numberY, 24, true, "center", gold);
  text(padNumber(data.draw.winner_number, data.campaign.number_quantity), 620, numberY + 146, 154, true, "center");
  const campaignLines = wrap(data.campaign.name, 1030, 30, true);
  let campaignY = numberY + 212;
  for (const line of campaignLines) { text(line, 620, campaignY, 30, true, "center"); campaignY += 38; }
  const congratulations = wrap("Sua participação ajudou a transformar vidas. Celebramos sua conquista e agradecemos por fazer parte desta corrente do bem!", 1020, 27);
  congratulations.forEach((line, index) => text(line, 620, Math.max(1460, campaignY + 25) + index * 38, 27, false, "center"));
  text(`Sorteio: ${drawDateTime(data.draw.drawn_at)}`, 620, 1605, 23, true, "center");
  addPage(); pdf.addPage(); base(2);
  text("REGISTRO DA CONQUISTA", 80, 222, 42, true);
  text("Compra paga e número vencedor conferidos", 80, 271, 26);
  let y = 340;
  const field = (label: string, value: string) => {
    const lines = wrap(value, 1060, 28);
    const height = 49 + lines.length * 36;
    if (y + height > 1590) { addPage(); pdf.addPage(); base(pdf.getNumberOfPages()); y = 220; }
    text(label.toUpperCase(), 80, y, 19, true, "left", gold); y += 38;
    for (const line of lines) { text(line, 80, y, 28); y += 36; }
    y += 15;
  };
  field("Ganhador", data.order.buyers.name);
  field("Campanha", data.campaign.name);
  field("Data e hora do sorteio", drawDateTime(data.draw.drawn_at));
  field("Data e hora da compra", drawDateTime(data.order.created_at));
  field("Pagamento confirmado em", drawDateTime(data.order.paid_at));
  field("Valor investido", `${formatBRL(data.order.amount)} • ${data.order.quantity} números`);
  field("Números comprados — vencedor em destaque", data.order.order_numbers.map(n => n.number).sort((a,b) => a-b).map(n => n === data.draw.winner_number ? `[ ${padNumber(n, data.campaign.number_quantity)} — GANHADOR ]` : padNumber(n, data.campaign.number_quantity)).join("   •   "));
  field("WhatsApp / E-mail", `${data.order.buyers.whatsapp ?? "Não informado"} / ${data.order.buyers.email ?? "Não informado"}`);
  if (data.order.seller_name) field("Vendedor", data.order.seller_name);
  field("Pedido", data.order.id);
  field("Registro do sorteio", data.draw.id);
  field("Privacidade", "Documento administrativo com dados pessoais. Compartilhe a primeira página para celebrar; preserve os dados da compra.");
  addPage();
  pdf.setProperties({ title: `Ganhador ${padNumber(data.draw.winner_number, data.campaign.number_quantity)} — ${data.campaign.name}`, author: "Associação Reviva Brasil" });
  pdf.save(`ganhador-${data.campaign.slug}-${padNumber(data.draw.winner_number, data.campaign.number_quantity)}.pdf`);
}