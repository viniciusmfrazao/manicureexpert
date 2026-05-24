"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type ProfessionalProfile = {
  id: string;
  bio: string | null;
  base_city: string;
  base_state: string;
  service_radius_km: number;
  travel_fee: number;
  is_active: boolean;
};

type PortfolioPhoto = {
  id: string;
  image_url: string;
  title: string | null;
};

type ProfessionalService = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
};

type AvailabilitySlot = {
  id: string;
  starts_at: string;
  ends_at: string;
  is_available: boolean;
};

export function ProfessionalDashboard() {
  const [userId, setUserId] = useState("");
  const [professionalId, setProfessionalId] = useState("");
  const [fullName, setFullName] = useState("Profissional Teste");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bio, setBio] = useState("Manicure e pedicure com atendimento em domicilio.");
  const [city, setCity] = useState("Sao Paulo");
  const [state, setState] = useState("SP");
  const [radius, setRadius] = useState(8);
  const [travelFee, setTravelFee] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [services, setServices] = useState<ProfessionalService[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [serviceName, setServiceName] = useState("");
  const [servicePrice, setServicePrice] = useState(0);
  const [serviceDuration, setServiceDuration] = useState(60);
  const [slotDate, setSlotDate] = useState("");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:00");
  const [message, setMessage] = useState("Carregando perfil profissional...");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    if (!supabase) {
      setMessage("Supabase nao configurado.");
      return;
    }

    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("Entre como profissional para salvar alteracoes.");
      return;
    }

    setUserId(user.id);

    const { data: publicProfile } = await supabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle();

    if (publicProfile?.full_name) setFullName(publicProfile.full_name);
    if (publicProfile?.avatar_url) setAvatarUrl(publicProfile.avatar_url);

    const { data: professionalProfile } = await supabase
      .from("professional_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle<ProfessionalProfile>();

    if (professionalProfile) {
      setProfessionalId(professionalProfile.id);
      setBio(professionalProfile.bio || "Manicure e pedicure com atendimento em domicilio.");
      setCity(professionalProfile.base_city);
      setState(professionalProfile.base_state);
      setRadius(professionalProfile.service_radius_km);
      setTravelFee(Number(professionalProfile.travel_fee));
      setIsActive(professionalProfile.is_active);
      await Promise.all([
        loadPhotos(professionalProfile.id),
        loadServices(professionalProfile.id),
        loadSlots(professionalProfile.id)
      ]);
    }

    setMessage("Perfil carregado.");
  }

  async function ensureProfessionalProfile() {
    if (professionalId) return professionalId;
    await saveProfile();

    if (!supabase || !userId) return "";
    const { data } = await supabase
      .from("professional_profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    const id = data?.id || "";
    setProfessionalId(id);
    return id;
  }

  async function loadPhotos(profileId: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from("professional_portfolio_photos")
      .select("id, image_url, title")
      .eq("professional_id", profileId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    setPhotos(data || []);
  }

  async function loadServices(profileId: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from("professional_services")
      .select("id, name, description, price, duration_minutes, is_active")
      .eq("professional_id", profileId)
      .order("created_at", { ascending: true });
    setServices(data || []);
  }

  async function loadSlots(profileId: string) {
    if (!supabase) return;
    const { data } = await supabase
      .from("availability_slots")
      .select("id, starts_at, ends_at, is_available")
      .eq("professional_id", profileId)
      .order("starts_at", { ascending: true });
    setSlots(data || []);
  }

  async function saveProfile() {
    if (!supabase || !userId) {
      setMessage("Entre como profissional para salvar.");
      return;
    }

    setIsSaving(true);
    setMessage("Salvando perfil...");

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ full_name: fullName, avatar_url: avatarUrl || null })
      .eq("id", userId);

    const { data, error } = await supabase
      .from("professional_profiles")
      .upsert(
        {
          user_id: userId,
          bio,
          base_city: city,
          base_state: state,
          base_latitude: -23.561414,
          base_longitude: -46.655881,
          service_radius_km: radius,
          travel_fee: travelFee,
          is_active: isActive,
          verification_status: "approved"
        },
        { onConflict: "user_id" }
      )
      .select("id")
      .single();

    setIsSaving(false);

    if (profileError || error) {
      setMessage(profileError?.message || error?.message || "Erro ao salvar.");
      return;
    }

    if (data?.id) {
      setProfessionalId(data.id);
      await Promise.all([loadServices(data.id), loadSlots(data.id), loadPhotos(data.id)]);
    }

    setMessage("Perfil salvo com sucesso.");
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !supabase || !userId) return;

    setIsAvatarUploading(true);
    setMessage("Enviando foto de perfil...");

    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/avatar-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("professional-portfolio")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      setIsAvatarUploading(false);
      setMessage(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("professional-portfolio")
      .getPublicUrl(filePath);

    const nextAvatarUrl = publicUrlData.publicUrl;
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: nextAvatarUrl })
      .eq("id", userId);

    setIsAvatarUploading(false);

    if (profileError) {
      setMessage(profileError.message);
      return;
    }

    setAvatarUrl(nextAvatarUrl);
    setMessage("Foto de perfil atualizada.");
  }

  async function uploadPhoto(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !supabase || !userId) return;

    const currentProfessionalId = await ensureProfessionalProfile();
    if (!currentProfessionalId) return;

    setIsUploading(true);
    setMessage("Enviando foto...");

    const extension = file.name.split(".").pop() || "jpg";
    const filePath = `${userId}/${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("professional-portfolio")
      .upload(filePath, file, { upsert: false });

    if (uploadError) {
      setIsUploading(false);
      setMessage(uploadError.message);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("professional-portfolio")
      .getPublicUrl(filePath);

    const { error: photoError } = await supabase
      .from("professional_portfolio_photos")
      .insert({
        professional_id: currentProfessionalId,
        image_url: publicUrlData.publicUrl,
        title: file.name.replace(/\.[^/.]+$/, ""),
        sort_order: photos.length + 1
      });

    setIsUploading(false);

    if (photoError) {
      setMessage(photoError.message);
      return;
    }

    setMessage("Foto adicionada ao portfolio.");
    await loadPhotos(currentProfessionalId);
  }

  async function deletePhoto(photoId: string) {
    if (!supabase || !professionalId) return;
    const { error } = await supabase
      .from("professional_portfolio_photos")
      .delete()
      .eq("id", photoId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Foto excluida.");
    await loadPhotos(professionalId);
  }

  async function addService() {
    if (!supabase) return;
    const currentProfessionalId = await ensureProfessionalProfile();
    if (!currentProfessionalId || !serviceName) return;

    const { error } = await supabase.from("professional_services").insert({
      professional_id: currentProfessionalId,
      name: serviceName,
      price: servicePrice,
      duration_minutes: serviceDuration,
      is_active: true
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setServiceName("");
    setServicePrice(0);
    setServiceDuration(60);
    setMessage("Servico adicionado.");
    await loadServices(currentProfessionalId);
  }

  async function deleteService(serviceId: string) {
    if (!supabase || !professionalId) return;
    const { error } = await supabase
      .from("professional_services")
      .delete()
      .eq("id", serviceId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Servico excluido.");
    await loadServices(professionalId);
  }

  async function addSlot() {
    if (!supabase) return;
    const currentProfessionalId = await ensureProfessionalProfile();
    if (!currentProfessionalId || !slotDate || !slotStart || !slotEnd) return;

    const startsAt = new Date(`${slotDate}T${slotStart}:00`);
    const endsAt = new Date(`${slotDate}T${slotEnd}:00`);

    if (endsAt <= startsAt) {
      setMessage("O horario final precisa ser depois do inicial.");
      return;
    }

    const { error } = await supabase.from("availability_slots").insert({
      professional_id: currentProfessionalId,
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      is_available: true
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Horario adicionado.");
    await loadSlots(currentProfessionalId);
  }

  async function deleteSlot(slotId: string) {
    if (!supabase || !professionalId) return;
    const { error } = await supabase.from("availability_slots").delete().eq("id", slotId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Horario excluido.");
    await loadSlots(professionalId);
  }

  const initials = fullName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <section className="pageGrid">
      <form className="pageCard stack" onSubmit={(event) => event.preventDefault()}>
        <h2>Perfil profissional</h2>
        <div className="profilePhotoEditor">
          {avatarUrl ? <img src={avatarUrl} alt="Foto de perfil" /> : <span>{initials || "ME"}</span>}
          <label className="fileButton">
            {isAvatarUploading ? "Enviando..." : "Alterar foto"}
            <input accept="image/*" type="file" onChange={uploadAvatar} disabled={isAvatarUploading} />
          </label>
        </div>
        <label>Nome publico<input value={fullName} onChange={(event) => setFullName(event.target.value)} /></label>
        <label>Cidade base<input value={city} onChange={(event) => setCity(event.target.value)} /></label>
        <label>Estado<input value={state} onChange={(event) => setState(event.target.value)} /></label>
        <label>Raio de atendimento<select value={`${radius}`} onChange={(event) => setRadius(Number(event.target.value))}><option value="5">5 km</option><option value="8">8 km</option><option value="12">12 km</option><option value="20">20 km</option></select></label>
        <label>Taxa de deslocamento<input type="number" min="0" value={travelFee} onChange={(event) => setTravelFee(Number(event.target.value))} /></label>
        <label>Bio<textarea value={bio} onChange={(event) => setBio(event.target.value)} /></label>
        <label className="toggleRow"><input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />Perfil ativo para atendimento</label>
        <button className="formButton" type="button" onClick={saveProfile} disabled={isSaving}>{isSaving ? "Salvando..." : "Salvar perfil"}</button>
        <p className="authMessage">{message}</p>
      </form>

      <div className="stack">
        <div className="pageCard">
          <div className="panelHeader"><strong>Fotos dos trabalhos</strong><label className="fileButton">{isUploading ? "Enviando..." : "Adicionar foto"}<input accept="image/*" type="file" onChange={uploadPhoto} disabled={isUploading} /></label></div>
          <div className="uploadDropzone">Envie fotos em qualquer formato. A plataforma padroniza a exibicao.</div>
          <div className="portfolioGrid">
            {photos.map((photo) => (
              <article className="portfolioPhoto" key={photo.id}>
                <img src={photo.image_url} alt={photo.title || "Trabalho de manicure"} />
                <span>{photo.title || "Trabalho"}</span>
                <button className="dangerButton" type="button" onClick={() => deletePhoto(photo.id)}>Excluir</button>
              </article>
            ))}
          </div>
        </div>

        <div className="pageCard stack">
          <div className="panelHeader"><strong>Servicos e valores</strong></div>
          <div className="inlineFields"><label>Servico<input value={serviceName} onChange={(event) => setServiceName(event.target.value)} placeholder="Ex: Manicure" /></label><label>Valor<input type="number" min="0" value={servicePrice} onChange={(event) => setServicePrice(Number(event.target.value))} /></label></div>
          <label>Duracao<select value={`${serviceDuration}`} onChange={(event) => setServiceDuration(Number(event.target.value))}><option value="30">30 min</option><option value="60">60 min</option><option value="90">90 min</option><option value="120">120 min</option></select></label>
          <button className="ghostButton" type="button" onClick={addService}>Adicionar servico</button>
          <ul className="serviceList">
            {services.map((service) => (
              <li key={service.id}><span>{service.name}</span><strong>R$ {Number(service.price).toFixed(2)}</strong><button className="dangerButton" type="button" onClick={() => deleteService(service.id)}>Excluir</button></li>
            ))}
          </ul>
        </div>

        <div className="pageCard stack">
          <div className="panelHeader"><strong>Disponibilidade de horarios</strong></div>
          <div className="inlineFields"><label>Data<input type="date" value={slotDate} onChange={(event) => setSlotDate(event.target.value)} /></label><label>Inicio<input type="time" value={slotStart} onChange={(event) => setSlotStart(event.target.value)} /></label></div>
          <label>Fim<input type="time" value={slotEnd} onChange={(event) => setSlotEnd(event.target.value)} /></label>
          <button className="ghostButton" type="button" onClick={addSlot}>Adicionar horario</button>
          <div className="slotList">
            {slots.map((slot) => (
              <div className="slotRow" key={slot.id}>
                <span>{new Date(slot.starts_at).toLocaleDateString("pt-BR")} - {new Date(slot.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} ate {new Date(slot.ends_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                <button className="dangerButton" type="button" onClick={() => deleteSlot(slot.id)}>Excluir</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
