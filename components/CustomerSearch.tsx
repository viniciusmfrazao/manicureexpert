"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type ProfessionalResult = {
  professional_id: string;
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  distance_km: number;
  average_rating: number;
  review_count: number;
  travel_fee: number;
};

type Service = {
  id: string;
  professional_id: string;
  name: string;
  price: number;
  duration_minutes: number;
};

type PortfolioPhoto = {
  id: string;
  professional_id: string;
  image_url: string;
  title: string | null;
};

type AvailabilitySlot = {
  id: string;
  professional_id: string;
  starts_at: string;
  ends_at: string;
};

export function CustomerSearch() {
  const [address, setAddress] = useState("Av. Paulista, 1000 - Sao Paulo");
  const [latitude, setLatitude] = useState(-23.561414);
  const [longitude, setLongitude] = useState(-46.655881);
  const [locationStatus, setLocationStatus] = useState("Voce tambem pode usar a localizacao automatica do celular.");
  const [professionals, setProfessionals] = useState<ProfessionalResult[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProfessionals(latitude, longitude);
  }, []);

  async function loadProfessionals(nextLatitude = latitude, nextLongitude = longitude) {
    if (!supabase) return;
    setIsLoading(true);
    setLocationStatus("Buscando profissionais proximas...");

    const { data, error } = await supabase.rpc("find_active_professionals", {
      customer_latitude: nextLatitude,
      customer_longitude: nextLongitude,
      max_distance_km: 20
    });

    if (error) {
      setIsLoading(false);
      setLocationStatus(error.message);
      return;
    }

    const nextProfessionals = (data || []) as ProfessionalResult[];
    setProfessionals(nextProfessionals);

    const professionalIds = nextProfessionals.map((professional) => professional.professional_id);
    if (professionalIds.length) {
      const [{ data: servicesData }, { data: photosData }, { data: slotsData }] = await Promise.all([
        supabase
          .from("professional_services")
          .select("id, professional_id, name, price, duration_minutes")
          .in("professional_id", professionalIds)
          .eq("is_active", true),
        supabase
          .from("professional_portfolio_photos")
          .select("id, professional_id, image_url, title")
          .in("professional_id", professionalIds)
          .order("sort_order", { ascending: true }),
        supabase
          .from("availability_slots")
          .select("id, professional_id, starts_at, ends_at")
          .in("professional_id", professionalIds)
          .eq("is_available", true)
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true })
      ]);

      setServices((servicesData || []) as Service[]);
      setPhotos((photosData || []) as PortfolioPhoto[]);
      setSlots((slotsData || []) as AvailabilitySlot[]);
    } else {
      setServices([]);
      setPhotos([]);
      setSlots([]);
    }

    setIsLoading(false);
    setLocationStatus(nextProfessionals.length ? "Profissionais encontradas para esta regiao." : "Nenhuma profissional ativa encontrada nesta regiao ainda.");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationStatus("Seu navegador nao liberou localizacao automatica.");
      return;
    }

    setLocationStatus("Buscando sua localizacao...");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nextLatitude = position.coords.latitude;
        const nextLongitude = position.coords.longitude;
        setLatitude(nextLatitude);
        setLongitude(nextLongitude);
        setAddress(`Localizacao atual: ${nextLatitude.toFixed(6)}, ${nextLongitude.toFixed(6)}`);
        loadProfessionals(nextLatitude, nextLongitude);
      },
      () => setLocationStatus("Nao foi possivel acessar sua localizacao."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function servicesFor(professionalId: string) {
    return services.filter((service) => service.professional_id === professionalId).slice(0, 4);
  }

  function photosFor(professionalId: string) {
    return photos.filter((photo) => photo.professional_id === professionalId).slice(0, 3);
  }

  function slotsFor(professionalId: string) {
    return slots.filter((slot) => slot.professional_id === professionalId).slice(0, 3);
  }

  return (
    <>
      <form className="pageCard stack">
        <h2>Buscar profissional</h2>
        <label>Endereco<input value={address} onChange={(event) => setAddress(event.target.value)} /></label>
        <button className="ghostButton" type="button" onClick={useCurrentLocation}>Usar minha localizacao</button>
        <p className="helperText">{locationStatus}</p>
        <label>Servico<select defaultValue="Manicure e pedicure"><option>Manicure e pedicure</option><option>Manicure</option><option>Pedicure</option><option>Alongamento</option></select></label>
        <div className="inlineFields"><label>Data<input type="date" /></label><label>Horario<input type="time" /></label></div>
        <button className="formButton" type="button" onClick={() => loadProfessionals()} disabled={isLoading}>{isLoading ? "Buscando..." : "Ver disponiveis"}</button>
        <Link className="secondaryFormButton" href="/login">Entrar para agendar</Link>
      </form>

      <div className="stack" id="resultados">
        <div className="professionalsGrid customerResults">
          {professionals.map((professional) => {
            const professionalServices = servicesFor(professional.professional_id);
            const professionalPhotos = photosFor(professional.professional_id);
            const professionalSlots = slotsFor(professional.professional_id);
            const initials = professional.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
            const firstPrice = professionalServices[0]?.price;

            return (
              <article className="professionalCard customerProfessionalCard" key={professional.professional_id}>
                <div className="customerProfileTop">
                  {professional.avatar_url ? <img className="profileAvatar" src={professional.avatar_url} alt={professional.full_name} /> : <span className="profileAvatarFallback">{initials || "ME"}</span>}
                  <div>
                    <div className="cardTitleRow"><strong>{professional.full_name}</strong><span>Verificada</span></div>
                    <p>{professional.bio || "Atendimento profissional de manicure e pedicure em domicilio."}</p>
                    <div className="metaRow"><span>★ {Number(professional.average_rating || 0).toFixed(1)}</span><span>{Number(professional.distance_km || 0).toFixed(1)} km</span><span>{professional.review_count} avaliacoes</span></div>
                  </div>
                </div>

                <div className="customerServices">
                  {professionalServices.length ? professionalServices.map((service) => (
                    <span key={service.id}>{service.name} <strong>R$ {Number(service.price).toFixed(2)}</strong></span>
                  )) : <span>Servicos em cadastro <strong>Consulte</strong></span>}
                </div>

                {professionalSlots.length ? <div className="customerSlots">{professionalSlots.map((slot) => <span key={slot.id}>{new Date(slot.starts_at).toLocaleDateString("pt-BR")} {new Date(slot.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>)}</div> : null}

                {professionalPhotos.length ? <div className="customerPortfolioStrip">{professionalPhotos.map((photo) => <img src={photo.image_url} alt={photo.title || "Trabalho de manicure"} key={photo.id} />)}</div> : null}

                <Link href="/login">Solicitar {firstPrice ? `R$ ${Number(firstPrice).toFixed(2)}` : "orcamento"}</Link>
              </article>
            );
          })}
        </div>
      </div>
    </>
  );
}
