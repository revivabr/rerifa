import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Film, Upload, FileDown, Trophy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { drawMediaSchema, parseYoutubeId } from "@/lib/draw-media";
import { saveDrawMedia, getWinnerDocument } from "@/lib/api/draw.functions";
import { drawDateTime } from "@/lib/winner-pdf";
import { padNumber } from "@/lib/format";

export function DrawPublication({ campaignId, total, refreshKey = 0 }: { campaignId: string; total: number; refreshKey?: number }) {
  const saveMedia = useServerFn(saveDrawMedia);
  const getDocument = useServerFn(getWinnerDocument);
  const [youtube, setYoutube] = useState("");
  const [videoPath, setVideoPath] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [artwork, setArtwork] = useState<"banner" | "prize">("banner");
  const [draws, setDraws] = useState<{ id: string; winner_number: number; drawn_at: string | null }[]>([]);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      const [{ data: media, error: mediaError }, { data: results, error: resultsError }] = await Promise.all([
        supabase.from("campaign_draw_media").select("youtube_id,video_path").eq("campaign_id", campaignId).maybeSingle(),
        supabase.from("draws").select("id,winner_number,drawn_at").eq("campaign_id", campaignId).order("drawn_at", { ascending: false }).limit(1000),
      ]);
      if (!active) return;
      setError(Boolean(mediaError || resultsError));
      setYoutube(media?.youtube_id ? `https://www.youtube.com/watch?v=${media.youtube_id}` : "");
      setVideoPath(media?.video_path ?? null); setDraws(results ?? []);
    })();
    return () => { active = false; };
  }, [campaignId, refreshKey]);

  async function saveLink() {
    const youtubeId = youtube.trim() ? parseYoutubeId(youtube.trim()) : null;
    if (youtube.trim() && !youtubeId) { toast.error("Informe um link válido do YouTube."); return; }
    setSaving(true);
    try {
      await saveMedia({ data: drawMediaSchema.parse({ campaignId, youtubeId, videoPath: youtubeId ? null : videoPath }) });
      if (youtubeId) setVideoPath(null);
      toast.success("Vídeo publicado na página da campanha!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível salvar."); }
    finally { setSaving(false); }
  }
  async function upload(file?: File) {
    if (!file) return;
    if (!["video/mp4", "video/webm"].includes(file.type) || file.size > 50 * 1024 * 1024) { toast.error("Envie MP4 ou WebM com até 50 MB; para vídeos maiores, use YouTube."); return; }
    setSaving(true);
    const path = `${campaignId}/${crypto.randomUUID()}.${file.type === "video/mp4" ? "mp4" : "webm"}`;
    try {
      const { error } = await supabase.storage.from("draw-videos").upload(path, file, { contentType: file.type });
      if (error) throw new Error("Não foi possível enviar o vídeo.");
      await saveMedia({ data: { campaignId, youtubeId: null, videoPath: path } });
      setVideoPath(path); setYoutube(""); toast.success("Vídeo enviado e publicado!");
    } catch (e) {
      await supabase.storage.from("draw-videos").remove([path]);
      toast.error(e instanceof Error ? e.message : "Não foi possível enviar.");
    } finally { setSaving(false); }
  }
  async function remove() {
    setSaving(true);
    try { await saveMedia({ data: { campaignId, youtubeId: null, videoPath: null } }); setYoutube(""); setVideoPath(null); toast.success("Vídeo retirado da página pública."); }
    catch { toast.error("Não foi possível remover o vídeo."); }
    finally { setSaving(false); }
  }
  async function download(drawId: string) {
    setBusy(drawId);
    try {
      const data = await getDocument({ data: { drawId } });
      const { generateWinnerPDF } = await import("@/lib/winner-pdf");
      await generateWinnerPDF(data, artwork);
      toast.success("PDF do ganhador gerado!");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Não foi possível gerar o PDF."); }
    finally { setBusy(null); }
  }
  return <section className="rounded-lg bg-card p-5 md:p-8 text-card-foreground space-y-8" aria-label="Publicação do sorteio">
    <div className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-bold text-primary"><Film className="h-5 w-5 text-gold" /> Vídeo do sorteio</h2>
      <div className="space-y-2"><Label htmlFor="draw-youtube">Link do YouTube</Label>
        <Input id="draw-youtube" value={youtube} onChange={e => setYoutube(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" maxLength={500} />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button onClick={saveLink} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Publicar link</Button>
        <Button asChild variant="outline" disabled={saving}><label className="cursor-pointer"><Upload className="h-4 w-4" /> Enviar vídeo
          <input aria-label="Enviar arquivo do sorteio" type="file" accept="video/mp4,video/webm" className="sr-only" disabled={saving} onChange={e => { void upload(e.target.files?.[0]); e.target.value = ""; }} />
        </label></Button>
        <Button variant="ghost" onClick={remove} disabled={saving || (!youtube && !videoPath)}>Retirar vídeo</Button>
      </div>
      <p className="text-sm text-muted-foreground">MP4 ou WebM até 50 MB. Para vídeos maiores, use o YouTube.</p>
      {videoPath && <p role="status" className="text-sm font-semibold text-success">Arquivo de vídeo publicado.</p>}
    </div>
    <div className="border-t border-border pt-6 space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-bold text-primary"><Trophy className="h-5 w-5 text-gold" /> Certificado do ganhador</h2>
      <div className="max-w-sm space-y-2"><Label>Arte do certificado</Label>
        <Select value={artwork} onValueChange={value => setArtwork(value === "prize" ? "prize" : "banner")}><SelectTrigger aria-label="Arte do certificado"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="banner">Banner da campanha</SelectItem><SelectItem value="prize">Imagem do prêmio</SelectItem></SelectContent>
        </Select>
      </div>
      {error && <p role="alert" className="text-destructive">Não foi possível carregar as informações do sorteio. Atualize a página.</p>}
      {!error && draws.length === 0 && <p className="text-sm text-muted-foreground">Salve o resultado do sorteio para emitir o certificado.</p>}
      {draws.map(draw => <div key={draw.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border py-4">
        <div><p className="font-bold text-primary">Número vencedor <span className="text-gold text-2xl tabular-nums">{padNumber(draw.winner_number, total)}</span></p>
          <p className="text-sm text-muted-foreground">{drawDateTime(draw.drawn_at)} · Brasília</p></div>
        <Button onClick={() => download(draw.id)} disabled={busy !== null} className="h-12"><FileDown className="h-5 w-5" />{busy === draw.id ? "Gerando PDF…" : "Gerar PDF do ganhador"}</Button>
      </div>)}
      <p className="text-xs text-muted-foreground">A primeira página celebra o ganhador; as seguintes contêm dados privados da compra.</p>
    </div>
  </section>;
}