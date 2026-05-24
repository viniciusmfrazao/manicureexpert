"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type ProfessionalProfile = { id: string; bio: string | null; base_city: string; base_state: string; service_radius_km: number; travel_fee: number; is_active: boolean; };
type PortfolioPhoto = { id: string; image_url: string; title: string | null; };

export function ProfessionalDashboard() {
  const [userId, setUserId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [fullName, setFullName] = useState("Profissional Teste");
  const [bio, setBio] = useState("Manicure e pedicure com atendimento em domicílio.");
  const [city, setCity] = useState("São Paulo");
  const [state, setState] = useState("SP");
  const [radius, setRadius] = useState(8);
  const [travelFee, setTravelFee] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [message, setMessage] = useState("Carregando perfil profissional...");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { loadProfile(); }, []);

  async function loadProfile() {
    if (!supabase) { setMessage("Supabase não configurado."); return; }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setMessage("Entre como profissional para salvar alterações."); return; }
    setUserId(user.id);

    const { data: publicProfile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
    if (publicProfile?.full_name) setFullName(publicProfile.full_name);

    const { data: professionalProfile } = await supabase.from("professional_profiles").select("*").eq("user_id", user.id).maybeSingle<ProfessionalProfile>();
    if (professionalProfile) {
      setProfessionalId(professionalProfile.id);
      setBio(professionalProfile.bio || "Manicure e pedicure com atendimento em domicílio.");
      setCity(professionalProfile.base_city);
      setState(professionalProfile.base_state);
      setRadius(professionalProfile.service_radius_km);
      setTravelFee(Number(professionalProfile.travel_fee));
      setIsActive(professionalProfile.is_active);
      await loadPhotos(professionalProfile.id);
    }
    setMessage("Perfil carregado.");
  }

  async function loadPhotos(profileId: string) {
    if (!supabase) return;
    const { data } = await supabase.from("professional_portfolio_photos").select("id, image_url, title").eq("professional_id", profileId).order("sort_order", { ascending: true }).order("created_at", { ascending: false });
    setPhotos(data || []);
  }

  async function saveProfile() {
    if (!supabase || !userId) { setMessage("Entre como profissional para salvar."); return; }
    setIsSaving(true); setMessage("Salvando perfil...");
    const { error: profileError } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", userId);
    const { data, error } = await supabase.from("professional_profiles").upsert({ user_id: userId, bio, base_city: city, base_state: state, base_latitude: -23.561414, base_longitude: -46.655881, service_radius_km: radius, travel_fee: travelFee, is_active: isActive, verification_status: "approved" }, { onConflict: "user_id" }).select("id").single();
    setIsSaving(false);
    if (profileError || error) { setMessage(profileError?.message || error?.message || "Erro ao salvar."); return; }
    if (data?.id) setProfessionalId(data.id);
    setMessage("Perfil salvo com sucesso.");
  }

  async function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !supabase || !userId) return;
    let currentProfessionalId = professionalId;
    if (!currentProfessionalId) {
      await saveProfile();
      const { data } = await supabase.from("professional_profiles").select("id").eq("user_id", userId).single();
      currentProfessionalId = data?.id || "";
      setProfessionalId(currentProfessionalId);
    }
    if (!currentProfessionalId) { setMessage("Salve o perfil antes de enviar fotos."); return; }
    setIsUploading(true); setMessage("Enviando foto...");
    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("professional-portfolio").upload(filePath, file, { upsert: false });
    if (uploadError) { setIsUploading(false); setMessage(uploadError.message); return; }
    const { data: publicUrlData } = supabase.storage.from("professional-portfolio").getPublicUrl(filePath);
    const { error: photoError } = await supabase.from("professional_portfolio_photos").insert({ professional_id: currentProfessionalId, image_url: publicUrlData.publicUrl, title: file.name.replace(/\.[^/.]+$/, ""), sort_order: photos.length + 1 });
    setIsUploading(false);
    if (photoError) { setMessage(photoError.message); return; }
    setMessage("Foto adicionada ao portfólio.");
    await loadPhotos(currentProfessionalId);
  }

  return <section className="pageGrid"><form className="pageCard stack" onSubmit={(event) => event.preventDefault()}><h2>Perfil profissional</h2><label>Nome público<input value={fullName} onChange={(event) => setFullName(event.target.value)} /></label><label>Cidade base<input value={city} onChange={(event) => setCity(event.target.value)} /></label><label>Estado<input value={state} onChange={(event) => setState(event.target.value)} /></label><label>Raio de atendimento<select value={`${radius}`} onChange={(event) => setRadius(Number(event.target.value))}><option value="5">5 km</option><option value="8">8 km</option><option value="12">12 km</option><option value="20">20 km</option></select></label><label>Taxa de deslocamento<input type="number" min="0" value={travelFee} onChange={(event) => setTravelFee(Number(event.target.value))} /></label><label>Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} /></label><label className="toggleRow"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />Perfil ativo para atendimento</label><button className="formButton" type="button" onClick={saveProfile} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar perfil"}</button><p className="authMessage">{message}</p></form><div className="stack"><div className="pageCard"><div className="panelHeader"><strong>Fotos dos trabalhos</strong><label className="fileButton">{isUploading ? "Enviando..." : "Adicionar foto"}<input accept="image/*" type="file" onChange={uploadPhoto} disabled={isUploading} /></label></div><div className="uploadDropzone">Envie fotos em qualquer formato. A plataforma padroniza a exibição.</div><div className="portfolioGrid">{photos.map((photo) => <article className="portfolioPhoto" key={photo.id}><img src={photo.image_url} alt={photo.title || "Trabalho de manicure"} /><span>{photo.title || "Trabalho"}</span></article>)}</div></div><div className="pageCard"><div className="panelHeader"><strong>Serviços e valores</strong><button className="chipButton" type="button">Adicionar</button></div><ul className="serviceList"><li><span>Manicure</span><strong>R$ 45</strong></li><li><span>Pedicure</span><strong>R$ 50</strong></li><li><span>Manicure + pedicure</span><strong>R$ 85</strong></li><li><span>Alongamento em gel</span><strong>R$ 160</strong></li></ul></div><div className="pageCard"><div className="panelHeader"><strong>Agenda disponível</strong><button className="chipButton" type="button">Editar</button></div><div className="timeGrid">{["09:00", "10:30", "13:00", "15:30", "17:00", "19:00"].map((time) => <span key={time}>{time}</span>)}</div></div></div></section>;
}
