import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { toast } from "sonner";
import { ArrowLeft, Info } from "lucide-react";

export const Route = createFileRoute("/admin/campaigns/new")({
  component: NewCampaign,
});

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function NewCampaign() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", slug: "", description: "", short_description: "", banner_url: "",
    prize_description: "", prize_image_1: "", prize_image_2: "",
    number_quantity: 100, number_price: 10,
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    goal_amount: "", pix_key: "", regulation_url: "", regulation_text: "", status: "draft", drive_folder_url: "",
  });
  const [loading, setLoading] = useState(false);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm(f => ({ ...f, [k]: v })); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.from("campaigns").insert({
      name: form.name,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      short_description: form.short_description || null,
      banner_url: form.banner_url || null,
      prize_description: form.prize_description || null,
      prize_image_1: form.prize_image_1 || null,
      prize_image_2: form.prize_image_2 || null,
      number_quantity: Number(form.number_quantity),
      number_price: Number(form.number_price),
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date).toISOString(),
      goal_amount: form.goal_amount ? Number(form.goal_amount) : null,
      pix_key: form.pix_key || null,
      regulation_url: form.regulation_url || null,
      regulation_text: form.regulation_text || null,
      drive_folder_url: form.drive_folder_url || null,

      status: form.status,
    }).select().single();
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Campanha criada!");
    navigate({ to: "/admin/campaigns/$id", params: { id: (data as { id: string }).id } });
  }

  return (
    <div className="space-y-6">
      <Link to="/admin/campaigns" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Voltar</Link>
      <h1 className="text-3xl font-black text-primary">Nova campanha</h1>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label>Nome da Campanha *</Label>
            <Input required value={form.name} onChange={e => { set("name", e.target.value); if (!form.slug) set("slug", slugify(e.target.value)); }} placeholder="Ex: Rifa de Natal 2026" />
          </div>
          <div>
            <Label>Slug (URL) *</Label>
            <Input required value={form.slug} onChange={e => set("slug", slugify(e.target.value))} placeholder="natal-solidario-2026" />
          </div>
          <div>
            <Label>Status</Label>
            <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.status} onChange={e => set("status", e.target.value)}>
              <option value="draft">Rascunho</option>
              <option value="active">Ativa</option>
              <option value="paused">Pausada</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <Label>Descrição</Label>
            <Textarea rows={3} value={form.description} onChange={e => set("description", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <ImageUpload 
              label="Imagem do Banner (16:9)" 
              value={form.banner_url} 
              onChange={v => set("banner_url", v)} 
            />
          </div>
          <div className="md:col-span-2">
            <Label>Pasta do Google Drive (Opcional)</Label>
            <Input 
              placeholder="Cole a URL da pasta do Google Drive" 
              value={form.drive_folder_url} 
              onChange={e => set("drive_folder_url", e.target.value)} 
            />
          </div>
          <div>
            <Label>Quantidade de números (100–1000) *</Label>
            <Input required type="number" min={100} max={1000} value={form.number_quantity} onChange={e => set("number_quantity", Number(e.target.value))} />
          </div>
          <div>
            <Label>Valor por número (R$) *</Label>
            <Input required type="number" min={1} step="0.01" value={form.number_price} onChange={e => set("number_price", Number(e.target.value))} />
          </div>
          <div>
            <Label>Data inicial *</Label>
            <Input required type="date" value={form.start_date} onChange={e => set("start_date", e.target.value)} />
          </div>
          <div>
            <Label>Data final *</Label>
            <Input required type="date" value={form.end_date} onChange={e => set("end_date", e.target.value)} />
          </div>
          <div>
            <Label>Meta financeira (R$)</Label>
            <Input type="number" step="0.01" value={form.goal_amount} onChange={e => set("goal_amount", e.target.value)} />
          </div>
          <div>
            <Label>Chave PIX</Label>
            <Input value={form.pix_key} onChange={e => set("pix_key", e.target.value)} placeholder="CNPJ ou e-mail" />
          </div>
          <div className="md:col-span-2">
            <Label>Regulamento (Texto Markdown)</Label>
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="h-3 w-3" /> Este texto será exibido em um modal para o usuário.
            </div>
            <Textarea 
              rows={6} 
              value={form.regulation_text} 
              onChange={e => set("regulation_text", e.target.value)} 
              placeholder="Cole aqui o regulamento da campanha em formato Markdown..."
            />
          </div>
          <div className="md:col-span-2">
            <Label>URL do regulamento (Link Externo)</Label>
            <Input value={form.regulation_url} onChange={e => set("regulation_url", e.target.value)} placeholder="https://… (Opcional se usar o texto acima)" />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="bg-primary text-white" size="lg">
          {loading ? "Criando…" : "Criar campanha"}
        </Button>
        <p className="text-xs text-muted-foreground">Ao criar, os {form.number_quantity} números são gerados automaticamente.</p>
      </form>
    </div>
  );
}
