import { useEffect, useState } from "react";
import { Film } from "lucide-react";
import type { PublicDrawMedia } from "@/lib/draw-media";

export function DrawVideo({ slug }: { slug: string }) {
  const [media, setMedia] = useState<PublicDrawMedia | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/public/draw-media/${encodeURIComponent(slug)}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null).then(setMedia).catch(() => {});
    return () => controller.abort();
  }, [slug]);
  if (!media?.youtubeId && !media?.videoUrl) return null;
  return <section className="border-y border-border py-8 space-y-4" aria-label="Vídeo do sorteio">
    <div className="text-center space-y-2"><Film className="mx-auto h-7 w-7 text-gold" />
      <h2 className="text-2xl font-bold text-primary">Reviva este momento</h2>
      <p className="text-muted-foreground">Assista ao vídeo oficial do sorteio.</p></div>
    <div className="mx-auto aspect-video w-full max-w-4xl overflow-hidden rounded-lg bg-muted">
      {media.youtubeId ? <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${media.youtubeId}`} title="Vídeo oficial do sorteio" loading="lazy" allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />
        : <video className="h-full w-full object-contain" src={media.videoUrl ?? undefined} controls playsInline preload="metadata" onError={() => setFailed(true)} />}
    </div>
    {failed && <p role="alert" className="text-center text-muted-foreground">Não foi possível carregar o vídeo. Tente novamente mais tarde.</p>}
  </section>;
}