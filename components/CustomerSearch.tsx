"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";

type ProfessionalResult = { professional_id: string; user_id: string; full_name: string; avatar_url: string | null; bio: string | null; distance_km: number; average_rating: number; review_count: number; travel_fee: number; };
type Service = { id: string; professional_id: string; name: string; price: number; duration_minutes: number; };
type PortfolioPhoto = { id: string; professional_id: string; image_url: string; title: string | null; };
type AvailabilitySlot = { id: string; professional_id: string; starts_at: string; ends_at: string; };
type Review = { id: string; booking_id: string; professional_id: string; rating: number; comment: string | null; created_at: string; };
type BookingToReview = { id: string; professional_id: string; starts_at: string; status: string; reviewed?: boolean; };

const serviceOptions = ["Todos", "Manicure", "Pedicure", "Manicure e pedicure", "Alongamento"];

export function CustomerSearch() {
  const [userId, setUserId] = useState("");
  const [address, setAddress] = useState("Av. Paulista, 1000 - Sao Paulo");
  const [latitude, setLatitude] = useState(-23.561414);
  const [longitude, setLongitude] = useState(-46.655881);
  const [locationStatus, setLocationStatus] = useState("Voce tambem pode usar a localizacao automatica do celular.");
  const [professionals, setProfessionals] = useState<ProfessionalResult[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [photos, setPhotos] = useState<PortfolioPhoto[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [bookingsToReview, setBookingsToReview] = useState<BookingToReview[]>([]);
  const [reviewComments, setReviewComments] = useState<Record<string, string>>({});
  const [reviewRatings, setReviewRatings] = useState<Record<string, number>>({});
  const [selectedServiceName, setSelectedServiceName] = useState("Todos");
  const [isLoading, setIsLoading] = useState(false);
  const [requestingId, setRequestingId] = useState("");

  useEffect(() => {
    loadSession();
    loadProfessionals(latitude, longitude);
  }, []);

  async function loadSession() {
    if (!supabase) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      await loadBookingsToReview(user.id);
    }
  }

  async function loadBookingsToReview(customerId: string) {
    if (!supabase) return;
    const { data: completedBookings } = await supabase.from("bookings").select("id, professional_id, starts_at, status").eq("customer_id", customerId).eq("status", "completed").order("starts_at", { ascending: false });
    const bookingIds = (completedBookings || []).map((booking) => booking.id);
    const { data: existingReviews } = bookingIds.length ? await supabase.from("reviews").select("booking_id").in("booking_id", bookingIds) : { data: [] };
    const reviewedIds = new Set((existingReviews || []).map((review) => review.booking_id));
    setBookingsToReview(((completedBookings || []) as BookingToReview[]).map((booking) => ({ ...booking, reviewed: reviewedIds.has(booking.id) })));
  }

  async function loadProfessionals(nextLatitude = latitude, nextLongitude = longitude) {
    if (!supabase) return;
    setIsLoading(true);
    setLocationStatus("Buscando profissionais proximas...");

    const { data, error } = await supabase.rpc("find_active_professionals", { customer_latitude: nextLatitude, customer_longitude: nextLongitude, max_distance_km: 20 });
    if (error) { setIsLoading(false); setLocationStatus(error.message); return; }

    const nextProfessionals = (data || []) as ProfessionalResult[];
    setProfessionals(nextProfessionals);

    const professionalIds = nextProfessionals.map((professional) => professional.professional_id);
    if (professionalIds.length) {
      const [{ data: servicesData, error: servicesError }, { data: photosData, error: photosError }, { data: slotsData }, { data: reviewsData }] = await Promise.all([
        supabase.from("professional_services").select("id, professional_id, name, price, duration_minutes").in("professional_id", professionalIds).eq("is_active", true),
        supabase.from("professional_portfolio_photos").select("id, professional_id, image_url, title").in("professional_id", professionalIds).order("sort_order", { ascending: true }),
        supabase.from("availability_slots").select("id, professional_id, starts_at, ends_at").in("professional_id", professionalIds).eq("is_available", true).gte("starts_at", new Date().toISOString()).order("starts_at", { ascending: true }),
        supabase.from("reviews").select("id, booking_id, professional_id, rating, comment, created_at").in("professional_id", professionalIds).eq("is_reported", false).order("created_at", { ascending: false })
      ]);
      setServices((servicesData || []) as Service[]);
      setPhotos((photosData || []) as PortfolioPhoto[]);
      setSlots((slotsData || []) as AvailabilitySlot[]);
      setReviews((reviewsData || []) as Review[]);
      if (servicesError || photosError) setLocationStatus(servicesError?.message || photosError?.message || "Nao foi possivel carregar todos os detalhes.");
    } else {
      setServices([]); setPhotos([]); setSlots([]); setReviews([]);
    }

    setIsLoading(false);
    setLocationStatus(nextProfessionals.length ? "Profissionais encontradas para esta regiao." : "Nenhuma profissional ativa encontrada nesta regiao ainda.");
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) { setLocationStatus("Seu navegador nao liberou localizacao automatica."); return; }
    setLocationStatus("Buscando sua localizacao...");
    navigator.geolocation.getCurrentPosition((position) => {
      const nextLatitude = position.coords.latitude;
      const nextLongitude = position.coords.longitude;
      setLatitude(nextLatitude); setLongitude(nextLongitude);
      setAddress(`Localizacao atual: ${nextLatitude.toFixed(6)}, ${nextLongitude.toFixed(6)}`);
      loadProfessionals(nextLatitude, nextLongitude);
    }, () => setLocationStatus("Nao foi possivel acessar sua localizacao."), { enableHighAccuracy: true, timeout: 10000 });
  }

  function allServicesFor(professionalId: string) { return services.filter((service) => service.professional_id === professionalId); }
  function servicesFor(professionalId: string) {
    const professionalServices = allServicesFor(professionalId);
    if (selectedServiceName === "Todos") return professionalServices.slice(0, 4);
    return professionalServices.filter((service) => service.name.toLowerCase().includes(selectedServiceName.toLowerCase())).slice(0, 4);
  }
  function photosFor(professionalId: string) { return photos.filter((photo) => photo.professional_id === professionalId).slice(0, 3); }
  function slotsFor(professionalId: string) { return slots.filter((slot) => slot.professional_id === professionalId).slice(0, 3); }
  function reviewsFor(professionalId: string) { return reviews.filter((review) => review.professional_id === professionalId).slice(0, 2); }

  async function requestBooking(professional: ProfessionalResult) {
    if (!supabase) return;
    if (!userId) { setLocationStatus("Entre como cliente para solicitar um atendimento."); return; }

    const selectedService = servicesFor(professional.professional_id)[0] || allServicesFor(professional.professional_id)[0];
    const selectedSlot = slotsFor(professional.professional_id)[0];
    if (!selectedService || !selectedSlot) { setLocationStatus("Esta profissional ainda nao tem servico ou horario disponivel."); return; }

    setRequestingId(professional.professional_id);
    const { data: addressData, error: addressError } = await supabase.from("customer_addresses").insert({ customer_id: userId, label: "Atendimento", street: address, city: "Sao Paulo", state: "SP", latitude, longitude }).select("id").single();
    if (addressError || !addressData) { setRequestingId(""); setLocationStatus(addressError?.message || "Nao foi possivel salvar o endereco."); return; }

    const { error: bookingError } = await supabase.from("bookings").insert({
      customer_id: userId,
      professional_id: professional.professional_id,
      service_id: selectedService.id,
      address_id: addressData.id,
      starts_at: selectedSlot.starts_at,
      ends_at: selectedSlot.ends_at,
      status: "requested",
      service_price: selectedService.price,
      travel_fee: professional.travel_fee,
      notes: `Solicitacao pelo Manicure Expert. Endereco informado: ${address}`
    });

    setRequestingId("");
    if (bookingError) { setLocationStatus(bookingError.message); return; }
    setLocationStatus("Solicitacao enviada. A profissional vai receber no painel dela.");
  }

  async function submitReview(booking: BookingToReview) {
    if (!supabase || !userId) return;
    const rating = reviewRatings[booking.id] || 5;
    const comment = reviewComments[booking.id] || "";
    const { error } = await supabase.from("reviews").insert({ booking_id: booking.id, customer_id: userId, professional_id: booking.professional_id, rating, comment });
    if (error) { setLocationStatus(error.message); return; }
    setLocationStatus("Avaliacao enviada. Obrigado pelo feedback.");
    await loadBookingsToReview(userId);
    await loadProfessionals(latitude, longitude);
  }

  const visibleProfessionals = selectedServiceName === "Todos" ? professionals : professionals.filter((professional) => servicesFor(professional.professional_id).length > 0);

  return (
    <>
      <form className="pageCard stack" onSubmit={(event) => event.preventDefault()}>
        <h2>Buscar profissional</h2>
        <label>Endereco<input value={address} onChange={(event) => setAddress(event.target.value)} /></label>
        <button className="ghostButton" type="button" onClick={useCurrentLocation}>Usar minha localizacao</button>
        <p className="helperText">{locationStatus}</p>
        <div className="serviceChooser" role="group" aria-label="Servico">
          {serviceOptions.map((service) => <button className={selectedServiceName === service ? "isSelected" : ""} type="button" key={service} onClick={() => setSelectedServiceName(service)}>{service}</button>)}
        </div>
        <div className="inlineFields"><label>Data<input type="date" /></label><label>Horario<input type="time" /></label></div>
        <button className="formButton" type="button" onClick={() => loadProfessionals()} disabled={isLoading}>{isLoading ? "Buscando..." : "Ver disponiveis"}</button>
        {!userId ? <Link className="secondaryFormButton" href="/login">Entrar para agendar</Link> : null}
      </form>

      <div className="stack" id="resultados">
        {bookingsToReview.some((booking) => !booking.reviewed) ? <section className="pageCard stack"><h2>Avaliar atendimento</h2>{bookingsToReview.filter((booking) => !booking.reviewed).map((booking) => <div className="reviewBox" key={booking.id}><span>Atendimento de {new Date(booking.starts_at).toLocaleDateString("pt-BR")}</span><select value={reviewRatings[booking.id] || 5} onChange={(event) => setReviewRatings({ ...reviewRatings, [booking.id]: Number(event.target.value) })}><option value="5">5 estrelas</option><option value="4">4 estrelas</option><option value="3">3 estrelas</option><option value="2">2 estrelas</option><option value="1">1 estrela</option></select><textarea placeholder="Conte como foi o atendimento" value={reviewComments[booking.id] || ""} onChange={(event) => setReviewComments({ ...reviewComments, [booking.id]: event.target.value })} /><button className="ghostButton" type="button" onClick={() => submitReview(booking)}>Enviar avaliacao</button></div>)}</section> : null}

        <div className="professionalsGrid customerResults">
          {visibleProfessionals.map((professional) => {
            const professionalServices = servicesFor(professional.professional_id);
            const professionalPhotos = photosFor(professional.professional_id);
            const professionalSlots = slotsFor(professional.professional_id);
            const professionalReviews = reviewsFor(professional.professional_id);
            const firstWorkPhoto = professionalPhotos[0]?.image_url || "";
            const displayAvatar = professional.avatar_url || firstWorkPhoto;
            const initials = professional.full_name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
            const firstPrice = professionalServices[0]?.price || allServicesFor(professional.professional_id)[0]?.price;

            return <article className="professionalCard customerProfessionalCard" key={professional.professional_id}>
              <div className="customerProfileTop">{displayAvatar ? <img className="profileAvatar" src={displayAvatar} alt={professional.full_name} /> : <span className="profileAvatarFallback">{initials || "ME"}</span>}<div><div className="cardTitleRow"><strong>{professional.full_name}</strong><span>Verificada</span></div><p>{professional.bio || "Atendimento profissional de manicure e pedicure em domicilio."}</p><div className="metaRow"><span>★ {Number(professional.average_rating || 0).toFixed(1)}</span><span>{Number(professional.distance_km || 0).toFixed(1)} km</span><span>{professional.review_count} avaliacoes</span></div></div></div>
              <div className="customerServices">{professionalServices.length ? professionalServices.map((service) => <span key={service.id}>{service.name} <strong>R$ {Number(service.price).toFixed(2)}</strong></span>) : <span>Servicos em cadastro <strong>Consulte</strong></span>}</div>
              {professionalSlots.length ? <div className="customerSlots">{professionalSlots.map((slot) => <span key={slot.id}>{new Date(slot.starts_at).toLocaleDateString("pt-BR")} {new Date(slot.starts_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>)}</div> : null}
              {professionalReviews.length ? <div className="reviewList">{professionalReviews.map((review) => <blockquote key={review.id}>★ {review.rating} {review.comment || "Cliente satisfeita com o atendimento."}</blockquote>)}</div> : null}
              {professionalPhotos.length ? <div className="customerPortfolioStrip">{professionalPhotos.map((photo) => <img src={photo.image_url} alt={photo.title || "Trabalho de manicure"} key={photo.id} />)}</div> : null}
              <button className="formButton" type="button" onClick={() => requestBooking(professional)} disabled={requestingId === professional.professional_id}>{requestingId === professional.professional_id ? "Enviando..." : `Solicitar ${firstPrice ? `R$ ${Number(firstPrice).toFixed(2)}` : "orcamento"}`}</button>
            </article>;
          })}
        </div>
      </div>
    </>
  );
}
